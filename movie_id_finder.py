import csv
ids = set()
with open("character_list5.csv") as csvfile:
	reader = csv.DictReader(csvfile)
	for row in reader:
		ids.add(row["script_id"])
	f = open('ids.txt', 'w')
	f.write(str(list(ids)))
