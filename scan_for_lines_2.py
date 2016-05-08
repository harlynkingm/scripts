import re
import csv
import difflib
import os

character_list = 'character_list5.csv'
metadata = 'meta_data7.csv'

direc = './data/script_downloads/html/'

def getMetadata(scriptId):
    # scriptId = filepath.strip('.txt').split('-')[1]
    chars = dict()
    charNames = []
    with open(metadata) as csvfile:
        reader = csv.DictReader(csvfile)
        movie = dict()
        for row in reader:
            if row['script_id'] == scriptId:
                movie['title'], movie['year'], movie['gross'] = row['title'], row['year'], row['gross']
                break
    with open(character_list) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if row['script_id'] == scriptId:
                newChar = dict()
                newChar['name'], newChar['words'], newChar['gender'], newChar['age'] = row['imdb_character_name'], row['words'], row['gender'], row['age']
                chars[newChar['name']] = newChar
                charNames += [newChar['name']]
    getDialogue(scriptId, chars, charNames, movie)


def getDialogue(sid, chars, charNames, movie):
    filename = 'allDialogue.csv'
    fieldnames = ['script_id', 'title', 'year', 'gross', 'name', 'age', 'gender', 'dialogue']
    with open(filename, 'a') as csvfile:
        newCSV = csv.writer(csvfile)
        # newCSV.writerow(fieldnames)
        f = open(direc + 'scrape-' + str(sid) + '.txt', 'read')
        s = f.read()
        s = s.replace('</b>', '')
        s = re.sub('&\w+;', '', s, 0)
        s = re.sub('\((\w|\s)+\)', '', s, 0)
        l = s.split('<b>')
        for block in range(1, len(l)):
            if (not l[block].strip('\n').strip(' ').isupper()):
                splitted = l[block].split('\n')
                if (splitted[0].isupper() and len(splitted) > 1 and splitted[1] != ''):
                    character = splitted[0].strip()
                    dialogue = ''
                    for speech in splitted[1:]:
                        if speech != '' and dialogue != '':
                            dialogue += ' ' + speech.strip().replace(',', '')
                        elif speech == '':
                            break
                        else:
                            dialogue += speech.strip().replace(',', '')
                    # print(character, dialogue)
                    realChar = getCharacter(character, charNames)
                    if realChar:
                        newCSV.writerow([sid, movie['title'], movie['year'], movie['gross'], realChar, chars[realChar]['age'], chars[realChar]['gender'], dialogue])
    print('File ' + sid + ' complete!')


def getCharacter(char, charNames):
    char = char.lower()
    possible = difflib.get_close_matches(char, charNames, cutoff=0.5)
    if len(possible):
        return possible[0]
    else:
        return None

for f in os.listdir(direc):
    if (f.endswith('.txt')):
        i = f.strip('.txt').split('-')[1]
        getMetadata(i)
