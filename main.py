from flask import Flask, jsonify, request, render_template
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


@app.route('/')
def file_manager():
    return render_template('file_manager.html')


if __name__ == '__main__':
    app.run(debug=True)
