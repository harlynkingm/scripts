import re

direc = './data/script_downloads/text/'
filepath = 'scrape-1001.txt'
f = open(direc + filepath, 'read')

line_was_char = False
line_char = ''
for line in f:
    line = re.sub('[^A-Za-z0-9 ]+', '', line)
    leading_spaces = len(line) - len(line.lstrip(' '))
    if (line_was_char):
        if (len(line.strip(' ')) == 0):
            line_was_char = False
            line_char = ''
        else:
            print(line_char)
    elif (line.isupper() and leading_spaces > 0 and len(line.strip(' ')) > 1):
        line_was_char = True
        line_char = line
