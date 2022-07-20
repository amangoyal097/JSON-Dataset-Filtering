from flask import Flask, request, make_response
import pandas as pd
import json
import numpy as np
import hashlib
import itertools
from operator import itemgetter
from collections import Counter
from datetime import date, datetime

# query1 = {
#     "column_name" : 'Age',
#     "type" : 'range',
#     "min" : 25,
#     "max" : 49
# }
# query2 = {
#     "column_name" : 'Age',
#     "type" : 'equal',
#     "value" : 52
# }
# query3 = {
#     "column_name" : 'Gender',
#     "type" : 'select',
#     "values" : ["Male"]
# }
# query4 = {
#     "column_name" : 'BMI',
#     "type" : 'range',
#     "min" : 28,
#     "max" : 31
# }
# query5 = {
#     "column_name" : 'Disease',
#     "type" : 'substring',
#     "value" : 'a'
# }
# query6 = {
#     "column_name" : 'Blood_Group',
#     "type" : 'select',
#     "values" : ["A+", "AB+", "O-", "O+"]
# }
# query7 = {
#     "column_name" : 'Date_of_Birth',
#     "type" : 'range',
#     "min" : '1972-08-12T20:17:46.384Z',
#     "max" : '2011-08-12T20:17:46.384Z'
# }
# json_qs = []
# json_qs.append(json.loads(json.dumps(query1)))
# json_qs.append(json.loads(json.dumps(query2)))
# json_qs.append(json.loads(json.dumps(query3)))
# json_qs.append(json.loads(json.dumps(query4)))
# json_qs.append(json.loads(json.dumps(query5)))
# json_qs.append(json.loads(json.dumps(query6)))
# json_qs.append(json.loads(json.dumps(query7)))

def priority_qs(json_qs):
    for json_q in json_qs:
        if json_q["type"] == "Equals":
            json_q["priority"] = 0
        elif json_q["type"] == "Substring":
            json_q["priority"] = 1
        elif json_q["type"] == "Range":
            json_q["priority"] = 1
        elif json_q["type"] == "Select":
            json_q["priority"] = 2
    json_qs = sorted(json_qs, key=itemgetter('column_name'))
    json_qs.sort(key = lambda x:x["priority"]) 
    return json_qs


def handle_equal(df,json_q):
    value = json_q["value"]
    column_name = json_q["column_name"]
    if np.issubdtype(df[column_name].dtypes,np.datetime64):
        value = np.datetime64(value)
        filtered = df.query("{0} == @value  ".format(column_name)) 
    else:
        filtered = df.query("{0} == @value  ".format(column_name)) 
        
    return filtered

def handle_range(df,json_q):
    min = json_q["min"]
    max = json_q["max"]
    column_name = json_q["column_name"]
    if np.issubdtype(df[column_name].dtypes,np.datetime64):
        min = np.datetime64(min)
        max = np.datetime64(max)
        filtered = df.query("{0} >= @min  & {1} <= @max ".format(column_name,column_name))
    else:
       filtered = df.query("{0} >= @min  & {1} <= @max ".format(column_name,column_name)) 
        
    return filtered

def handle_substring(df,json_q):
    value = json_q["value"]
    value = value.lower()
    column_name = json_q["column_name"]
    filtered = df[df[column_name].str.lower().str.contains(value,regex=False)]
    return filtered

def handle_select(df,json_q):
    values = json_q["values"]
    column_name = json_q["column_name"]
    filtered = df.loc[df[column_name].isin(values)]
    return filtered

def handle_type(df,json_q):
    if json_q["type"] == 'Equals':
        return handle_equal(df,json_q)
    elif json_q["type"] == 'Range':
        return handle_range(df,json_q)
    elif json_q["type"] == 'Substring':
        return handle_substring(df,json_q)
    elif json_q["type"] == 'Select':
        return handle_select(df,json_q)

def handle_queries(df,json_qs,c):
    json_qs = priority_qs(json_qs)
    filtered = df
    i = 0
    while i < len(json_qs):
        if(c[json_qs[i]["column_name"]]==1):
            filtered = handle_type(filtered.copy(),json_qs[i])
            i += 1
        else:
            dfs = []
            for j in range (c[json_qs[i]["column_name"]]):
                dfs.append(filtered)
                dfs[j] = handle_type(dfs[j],json_qs[i+j])
            filtered = dfs[0]
            for j in range (c[json_qs[i]["column_name"]]): # should the range start from 1?
                filtered = pd.concat([filtered,dfs[j]])
            i += c[json_qs[i]["column_name"]]
            filtered = filtered.drop_duplicates()
            
    return filtered 


def filter_data(json_qs,hash):
    with open('./stored_files/'+hash+'.json','r') as f:
        data = json.loads(f.read())
    df = pd.DataFrame.from_dict(data["data"])
    for cols in data["metadata"]:
        if cols["dataType"].find("date") != -1 or cols["dataType"].find("time") != -1:
            df[cols["fieldName"]] = pd.to_datetime(df[cols["fieldName"]])

    df.columns = df.columns.str.replace(' ','_')

    c = Counter(json_q['column_name'] for json_q in json_qs)
    c = dict(c)  
    return handle_queries(df,json_qs,c)


#print(data_query('1c3138f3bf0ef6722e481105df2c51993123ccd080a0195b67fccce1ec193e3b',json_qs))




