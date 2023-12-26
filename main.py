from flask import Flask, jsonify, request, render_template
import datetime
import os
import shutil
import psutil

app = Flask(__name__)


@app.route('/partitions', methods=['GET'])
def getPartitionsId():
    partitions = []
    try:
        for partition in psutil.disk_partitions():
            partitions.append(partition.device[0])
    except Exception as e:
        return jsonify(error=str(e)), 500

    return jsonify({'partitions': partitions}), 200


@app.route('/folder/<partition>', methods=['POST'])
def createFolder(partition):
    path = request.args.get('path', None)
    folder_path = f"{partition}://{path}" if path else f"{partition}://"

    if os.path.isdir(folder_path):
        return jsonify({'error': 'The folder already exists'})
    try:
        os.mkdir(folder_path)
        return jsonify({'message': 'Folder created successfully'})
    except Exception as e:
        return jsonify({"error": f"Could not create folder {folder_path}: {e}"})


@app.route('/file/<partition>', methods=['POST'])
def createFile(partition):
    path = request.args.get('path', None)
    file_path = f"{partition}://{path}" if path else f"{partition}://"

    if os.path.isfile(file_path):
        return jsonify({'error': 'The file already exists'})
    try:
        with open(file_path, 'x') as file:
            pass
        return jsonify({'success': f'File created at {file_path}'}), 201
    except FileExistsError:
        return jsonify({'error': 'The file already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/<partition>', methods=['GET'])
def show_partition(partition):
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
    paths = request.json.get('paths', [])
    for path in paths:
        if not os.path.exists(path):
            return jsonify({"error": f"Path {path} does not exist"})
        try:
            shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
        except Exception as e:
            return jsonify({"error": f"Could not delete element {path}: {e}"})
    return jsonify({"message": "All elements have been successfully deleted"})


@app.route('/copy/<partition>', methods=['POST'])
def copy_items(partition):
    path = request.args.get('path', None)
    base_path = f"{partition}://{path}" if path else f"{partition}://"

    paths = request.json.get('paths', [])
    results = []

    for src_path in paths:
        try:
            filename = os.path.basename(src_path)
            dest_path = os.path.join(base_path, filename)
            if os.path.exists(dest_path):
                results.append({"src_path": src_path, "dest_path": dest_path, "status": "Skipped",
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
            results.append({"src_path": src_path, "dest_path": dest_path, "status": "Copied"})
        except Exception as e:
            results.append({"src_path": src_path, "status": "Failed", "reason": str(e)})
    return jsonify({"message": "Copy operation completed", "results": results})


@app.route('/move/<partition>', methods=['POST'])
def move_items(partition):
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
                "status": "Moved"
            })
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
    data = request.json
    src = data.get('src', None)
    dest = data.get('dest', None)
    print(f"src {src}")
    print(f"dest {dest}")
    if not src or not dest:
        return jsonify({"error": "Source and destination must be provided"}), 400

    try:
        if not os.path.exists(src):
            return jsonify({"error": "Source file or directory does not exist"}), 404
        os.rename(src, dest)
        return jsonify({"message": f"Successfully renamed {src} to {dest}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/textfile/<partition>', methods=['GET'])
def get_textfile(partition):
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/textfile/<partition>', methods=['POST'])
def edit_textfile(partition):
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def file_manager():
    return render_template('file_manager.html')


if __name__ == '__main__':
    app.run(debug=True)
