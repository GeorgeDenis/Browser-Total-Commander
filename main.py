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
    if path is not None:
        folder_path = f"{partition}://{path}"
    else:
        folder_path = f"{partition}://"
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
    if path is not None:
        file_path = f"{partition}://{path}"
    else:
        file_path = f"{partition}://"
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
    if path is not None:
        base_path = f"{partition}://{path}"
    else:
        base_path = f"{partition}://"
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
        print(path)
        if not os.path.exists(path):
            return jsonify({"error": f"Path {path} does not exist"})
        try:
            shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
        except Exception as e:
            return jsonify({"error": f"Could not delete element {path}: {e}"})
    return jsonify({"message": "All elements have been successfully deleted"})


@app.route('/')
def file_manager():
    return render_template('file_manager.html')


if __name__ == '__main__':
    app.run(debug=True)
