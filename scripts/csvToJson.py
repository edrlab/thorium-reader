import json
import csv
import sys

path = sys.argv[1]
resultPath = sys.argv[2]
languageNameId = int(sys.argv[3])
codeId = int(sys.argv[4])

resultObj = {}

with open(path) as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    line_count = 0
    for row in csv_reader:
        if line_count != 0:
            resultObj[row[codeId]] = row[languageNameId]
        line_count += 1

result = json.dumps({"languages": resultObj}, ensure_ascii=False)

f = open(resultPath,"w+")
f.write(result)
f.close()
