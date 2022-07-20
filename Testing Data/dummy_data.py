import json
import random
import datetime
import pandas as pd

rows = int(1e6)
data = {"metadata": [], "data": []}
data["metadata"] = [
    {"fieldName": "Id", "dataType": "number"},
    {"fieldName": "age", "dataType": "number"},
    {"fieldName": "gender", "dataType": "string"},
    {"fieldName": "bloodGroup", "dataType": "string"},
    {"fieldName": "dob", "dataType": "date"},
    {"fieldName": "disease", "dataType": "string"},
    {"fieldName": "bmi", "dataType": "number"},
]

genders = ["Male", "Female"]
bloodGroups = ["A-", "B+", "AB+", "O+", "B-", "O-", "A+", "AB-"]
with open("diseases_list.txt", "r") as f:
    for line in f:
        diseases = line.split(",")

for i in range(rows):
    dob = datetime.date(
        random.randint(1942, 1982), random.randint(1, 12), random.randint(1, 28)
    )
    age = datetime.datetime.today().year - dob.year
    gender = random.choice(genders)
    bloodGroup = random.choice(bloodGroups)
    bmi = round(random.uniform(23, 35), 1)
    disease = random.choice(diseases)
    obj = {
        "Id": i + 1,
        "Age": age,
        "Gender": gender,
        "Blood Group": bloodGroup,
        "Date of Birth": dob.strftime("%Y-%m-%d"),
        "Disease": disease,
        "BMI": bmi,
    }
    data["data"].append(obj)
# print(json.dumps(data,indent=3))
with open("big_data.json", "w") as f:
    json.dump(data, f)
