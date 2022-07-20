import json
import pandas as pd
import hashlib


def make_filters(data):
    file_hash = hashlib.sha256(json.dumps(data).encode()).hexdigest()

    with open("stored_files/" + file_hash + ".json","w+") as f:
        json.dump(data,f)

    df = pd.DataFrame.from_dict(data["data"])
    for cols in data["metadata"]:
        if cols["dataType"].lower().find("date") != -1 or cols["dataType"].lower().find("time") != -1:
            df[cols["fieldName"]] = pd.to_datetime(df[cols["fieldName"]])

    filters = []
    for col in df:
        filter = {}
        filter["name"] = col
        filter["select"] = False
        filter["range"] = False
        filter["search"] = True
        filter["substring"] = False

        unique_values = pd.unique(df[col])

        if len(unique_values) <= 10:
            filter["select"] = True
            filter["search"] = False
            filter["selections"] = unique_values

        elif df[col].dtype != "object":
            filter["range"] = True
            if df[col].dtype == "datetime64[ns]":
                filter["rangeValues"] = [
                    df[col].min().isoformat(),
                    df[col].max().isoformat(),
                ]
            else:
                filter["rangeValues"] = [df[col].min(), df[col].max()]

        if df[col].dtype == "object" and len(unique_values) > 10:
            filter["substring"] = True

        filters.append(filter)

    columns = list(df.keys())
    return filters, columns, data["data"], file_hash, data["metadata"]