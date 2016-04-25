import csv
ids = set()
count = 0
with open("character_list5.csv") as csvfile:
	reader = csv.DictReader(csvfile)
	for row in reader:
		if count < 300:
			ids.add(row["script_id"])
		count = len(ids) 
	print(len(ids)) 
	f = open('ids.txt', 'w')
	f.write(str(list(ids)))
