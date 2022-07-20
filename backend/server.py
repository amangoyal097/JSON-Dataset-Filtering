from flask import Flask, request, make_response
import pandas as pd
import json
import numpy as np
from make_filters import make_filters
from filter_data import filter_data
import datetime
app = Flask(__name__)


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def addTimeZone(dateString):
    try:
        datetime_obj = datetime.datetime.strptime(dateString,'%Y-%m-%dT%H:%M:%S.000Z') + datetime.timedelta(hours=6,minutes=30)
    except:
        pass
    try:
        datetime_obj = datetime.datetime.strptime(dateString,'%Y-%m-%dT%H:%M:%S') + datetime.timedelta(hours=6,minutes=30)
    except:
        pass
    return datetime_obj.isoformat()


@app.route("/uploadfile", methods=["POST"])
def upload():
    try:
        data = json.load(request.files["myFile"])
        filters,columns,rows,file_hash, meta = make_filters(data)
        response = make_response()
        response.data = json.dumps(
            {"filters": filters, "columns": columns, "rows": rows, "file_name": file_hash, "meta": meta}, cls=NpEncoder
        )
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
    except Exception as e:
        print(e)
        response = make_response("Error while parsing JSON",400)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response

@app.route("/filterData", methods=["POST"])
def filter():
    data = dict(request.form)
    data['filters'] = json.loads(data['filters'])
    for index,filter in enumerate(data['filters']):
       data['filters'][index]['column_name'] =  data['filters'][index]['column_name'].replace(" ","_")
       if filter['column_data_type'].find("date") != -1 or filter['column_data_type'].find("time") != -1:
            if filter['type'] == "Equals":
               data['filters'][index]['value'] = addTimeZone(data['filters'][index]['value'])
            else:
                data['filters'][index]['min'] = addTimeZone(data['filters'][index]['min'])
                data['filters'][index]['max'] = addTimeZone(data['filters'][index]['max'])
           
    df = filter_data(data['filters'],data['fileHash'])
    df.columns = df.columns.str.replace('_',' ')
    for cols in df.columns:
        if df[cols].dtype == "datetime64[ns]":
            df[cols] = df[cols].astype(str)
    new_rows = json.loads(df.to_json(orient='records'))
    response = make_response()
    response.data = json.dumps(
            {"rows": new_rows}, cls=NpEncoder
        )
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/", methods=["GET"])
def home():
    return "Server up and running"

if __name__ == "__main__":
    app.run(port=8080)
