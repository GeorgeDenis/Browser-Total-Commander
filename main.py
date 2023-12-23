from flask import Flask, jsonify, request, render_template
import datetime
import os
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


@app.route('/<partition>', methods=['GET'])
def show_partition(partition):
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
        return jsonify({"error": f"Nu s-a putut accesa partiția {partition}: {e}"}), 500

    return jsonify({"folders": files}), 200


@app.route('/')
def file_manager():
    return render_template('file_manager.html')


if __name__ == '__main__':
    app.run(debug=True)
