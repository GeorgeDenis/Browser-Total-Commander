"""Browser Total Commander Module.

This module provides a web application that mimics the functionality of Total Commander,
a file manager with capabilities for file browsing, organizing, and editing. It allows users
to perform various file operations copy, delete, move, rename, create files, create folders, edit text files and view
content within a browser interface. The module is designed to offer a similar experience to Total Commander users with
additional web-base benefits.
"""
from flask import Flask, jsonify, request, render_template
import datetime
import os
import shutil
import psutil

app = Flask(__name__)


@app.route('/partitions', methods=['GET'])
def get_partition():
    """
    Get a list of disk partitions.

    Retrieves the mounted disk partitions using the psutil library and returns them
    as a JSON response. Each partition is represented by its device name.

    Returns:
        A JSON object with a 'partitions' key containing a list of partitions.
        On error, returns a JSON object with an 'error' key and status code 500.
    """
    partitions = []
    try:
        for partition in psutil.disk_partitions():
            partitions.append(partition.device[0])
    except Exception as e:
        return jsonify(error=str(e)), 500

    return jsonify({'partitions': partitions}), 200


@app.route('/folder/<partition>', methods=['POST'])
def create_folder(partition):
    """
    Create a folder in the specified partition and path.

    This function creates a folder in the given partition with the path provided
    via 'path' argument in the request. If the 'path' argument is not provided, it defaults
    to the root of the specified partition.

    Args:
        partition: A string indicating the partition on which to create the folder.

    Returns:
        A JSON response indicating success or failure. On success, returns a message
        indicating the folder was created. On failure, returns an error message with details.
    """
    path = request.args.get('path', None)
    # Construct the full folder path
    folder_path = f"{partition}://{path}" if path else f"{partition}://"

    # Check if the folder already exists
    if os.path.isdir(folder_path):
        return jsonify({'error': 'The folder already exists'})
    try:
        os.mkdir(folder_path)
        return jsonify({'message': 'Folder created successfully'})
    except OSError as oe:
        return jsonify({'error': f"OS error: {str(oe)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Could not create folder {folder_path}: {e}"})


@app.route('/file/<partition>', methods=['POST'])
def create_file(partition):
    """Create a file in the specified partition and path.

        This function creates a file in the given partition with the path provided
        via 'path' argument in the request. If the 'path' argument is not provided, it defaults
        to the root of the specified partition.

        Args:
            partition: A string indicating the partition on which to create the file.

        Returns:
            A JSON response indicating success or failure. On success, returns a message
            indicating the file was created. On failure, returns an error message with details.
        """
    path = request.args.get('path', None)
    file_path = f"{partition}://{path}" if path else f"{partition}://"

    if os.path.isfile(file_path):
        return jsonify({'error': 'The file already exists'})
    try:
        with open(file_path, 'x') as file:
            pass
        return jsonify({'message': f'File created at {file_path}'}), 201
    except FileExistsError:
        return jsonify({'error': 'The file already exists'}), 400
    except OSError as oe:
        return jsonify({'error': f"OS error: {str(oe)}"}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/<partition>', methods=['GET'])
def show_partition(partition):
    """Returns the files and directories structure from the specified partition and path.

        This function returns the files and directories structure in the given partition with the path provided
        via 'path' argument in the request. If the 'path' argument is not provided, it defaults
        to the root of the specified partition.

        Args:
            partition: A string indicating the partition on which to create the file.

        Returns:
            A JSON response indicating success or failure. On success, returns the files from the specified partition
            and path along some properties like path, extension, size, the date when the file was created. On failure,
            returns an error message with details.
        """
    path = request.args.get('path', None)
    base_path = f"{partition}://{path}" if path else f"{partition}://"
    files = {}
    exclusions = {'$RECYCLE.BIN', '$Recycle.Bin', '.GamingRoot', 'System Volume Information'}

    try:
        for name in os.listdir(base_path):
            if name in exclusions:
                continue
            path = os.path.join(base_path, name)
            file_stats = os.stat(path)
            extension = os.path.splitext(name)[1]
            size = 0 if os.path.isdir(path) else file_stats.st_size
            date = datetime.datetime.fromtimestamp(file_stats.st_ctime).strftime('%Y-%m-%d %H:%M')
            files[name] = {'path': path, 'extension': extension, 'size': size, 'date': date}
    except Exception as e:
        return jsonify({"error": f"Could not access partition {partition}: {e}"}), 500

    return jsonify({"folders": files}), 200


@app.route('/', methods=['DELETE'])
def delete_items():
    """
        Delete files and directories from the specified paths.

        This function attempts to delete files and directories specified in the 'paths' JSON array from the request
        body.

        Returns:
            A JSON response indicating success or failure. On success, returns a message
            indicating the file or the files were deleted. On failure, returns an error message with details.
        """
    paths = request.json.get('paths', [])
    results = []
    for path in paths:
        try:
            if not os.path.exists(path):
                results.append({"path": path, "status": "Failed", "reason": f"Path {path} does not exist"})
                continue
            shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
            results.append({"src_path": path, "status": "Success"})
        except OSError as oe:
            results.append({"src_path": path, "status": "Failed", "reason": f"OS error: {str(oe)}"})
        except Exception as e:
            results.append({"src_path": path, "status": "Failed", "reason": f"Could not delete element {path}: {e}"})
    return jsonify({"message": "All elements have been successfully deleted", "results": results})


@app.route('/copy/<partition>', methods=['POST'])
def copy_items(partition):
    """Copy items from the given paths to the specified partition and path.

        This function attempts to copy files and directories specified in the 'paths'
        JSON array from the request body to the target partition and path with the path provided
        via 'path' argument in the request. If the 'path' argument is not provided, it defaults
        to the root of the specified partition. It returns a summary of the copy operations, including successes
        and failures.

        Args:
            partition: A string indicating the target partition for the copy operation.

        Returns:
            A JSON object summarizing the results of the copy operations, including
            paths attempted, status of each, and any failure reasons.
        """
    path = request.args.get('path', None)
    base_path = f"{partition}://{path}" if path else f"{partition}://"

    paths = request.json.get('paths', [])
    results = []

    for src_path in paths:
        try:
            filename = os.path.basename(src_path)
            dest_path = os.path.join(base_path, filename)
            if os.path.exists(dest_path):
                results.append({"src_path": src_path, "dest_path": dest_path, "status": "Failed",
                                "reason": "Destination file already exists"})
                continue
            if os.path.isdir(src_path):
                shutil.copytree(src_path, dest_path)
            elif os.path.isfile(src_path):
                shutil.copy(src_path, dest_path)
            else:
                results.append(
                    {"src_path": src_path, "status": "Failed", "reason": "Source is not a valid file or directory"})
                continue
            results.append({"src_path": src_path, "dest_path": dest_path, "status": "Success"})
        except OSError as oe:
            results.append({"src_path": src_path, "status": "Failed", "reason": f"OS error: {str(oe)}"})
        except Exception as e:
            results.append({"src_path": src_path, "status": "Failed", "reason": str(e)})
    return jsonify({"message": "Copy operation completed", "results": results})


@app.route('/move/<partition>', methods=['POST'])
def move_items(partition):
    """Move items from the given paths to the specified partition and path.

        This function attempts to move files and directories specified in the 'paths'
        JSON array from the request body to the target partition and path. It returns
        a summary of the move operations, including successes and failures.

        Args:
            partition: A string indicating the target partition for the move operation.

        Returns:
            A JSON object summarizing the results of the move operations, including
            paths attempted, status of each, and any failure reasons.
        """
    path = request.args.get('path', None)
    base_path = f"{partition}://{path}" if path else f"{partition}://"
    paths = request.json.get('paths', [])
    results = []
    for src_path in paths:
        try:
            item_name = os.path.basename(src_path)
            dest_path = os.path.join(base_path, item_name)
            if os.path.exists(dest_path):
                results.append({
                    "src_path": src_path,
                    "dest_path": dest_path,
                    "status": "Failed",
                    "reason": "Destination file or directory already exists"
                })
                continue
            shutil.move(src_path, dest_path)

            results.append({
                "src_path": src_path,
                "dest_path": dest_path,
                "status": "Success"
            })
        except OSError as oe:
            results.append({"src_path": src_path, "status": "Failed", "reason": f"OS error: {str(oe)}"})
        except Exception as e:
            results.append({
                "src_path": src_path,
                "status": "Failed",
                "reason": str(e)
            })
    return jsonify({
        "message": "Move operation completed",
        "results": results
    })


@app.route('/rename', methods=['POST'])
def rename_data():
    """Rename a file or a folder from the specified source name with the specified destination name.

        This function renames a file or a folder name from the specified source with the destination name,
        both source name and destination name are taken from the request body.

        Returns:
            A JSON response indicating success or failure. On success, returns a message
            indicating the file or folder was renamed with the provided name. On failure,
            returns an error message with details.
        """
    data = request.json
    source = data.get('src', None)
    destination = data.get('dest', None)
    if not source or not destination:
        return jsonify({"error": "Source and destination must be provided"}), 400
    try:
        if not os.path.exists(source):
            return jsonify({"error": "Source file or directory does not exist"}), 404
        if os.path.exists(destination):
            return jsonify({"error": "Destination file or directory already exists"}), 400
        os.rename(source, destination)
        return jsonify({"message": f"Successfully renamed {source} to {destination}"})
    except OSError as oe:
        return jsonify({"error": f"OS error: {str(oe)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/textfile/<partition>', methods=['GET'])
def get_textfile(partition):
    """Get a text file content from the specified partition and path.

        This function takes a text file content from the specified partition and path with the path provided
        via 'path' argument in the request. If the 'path' argument is not provided, it returns an error message.

        Args:
            partition: A string indicating the partition on which to get the text content.

        Returns:
            A JSON response indicating success or failure. On success, returns a message
            indicating the file was edited. On failure, returns an error message with details.
        """
    path = request.args.get('path', None)
    if not path:
        return jsonify({"error": "Path is required"}), 400
    base_path = f"{partition}://{path}"
    try:
        if not os.path.isfile(base_path):
            return jsonify({"error": "File does not exist or is not a file"}), 404
        with open(base_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({"text": content})
    except IOError as e:
        return jsonify({"error": f"Could not read file: {e}"}), 500
    except OSError as oe:
        return jsonify({"error": f"OS error: {str(oe)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/textfile/<partition>', methods=['POST'])
def edit_textfile(partition):
    """Edit a text file from the specified partition and path.

    This function edits a file from the specified partition and path with the path provided
    via 'path' argument in the request. If the 'path' argument is not provided, it returns an error message.

    Args:
        partition: A string indicating the partition on which to edit the file.

    Returns:
        A JSON response indicating success or failure. On success, returns a message
        indicating the file was edited. On failure, returns an error message with details.
    """
    path = request.args.get('path', None)
    data = request.json
    text = data.get('text', None)
    if not path:
        return jsonify({"error": "Path is required"}), 400
    base_path = f"{partition}://{path}"
    try:
        if not os.path.isfile(base_path):
            return jsonify({"error": "File does not exist or is not a file"}), 404
        with open(base_path, 'w', encoding='utf-8') as f:
            content = f.write(text)
        return jsonify({"message": f"Successfully edited {path}"})
    except IOError as e:
        return jsonify({"error": f"Could not edit file: {e}"}), 500
    except UnicodeEncodeError as e:
        return jsonify({"error": f"Encoding error with provided text: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def file_manager():
    """
    The function is used to generate output from a template file based on the Jinja2 engine that is found in the
    application's templates folder
    Returns:
        An HTML template as a response
    """
    return render_template('file_manager.html')


if __name__ == '__main__':
    app.run(debug=True)
