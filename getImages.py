import requests as req, shutil, json, sys, os
from urllib import request
from selenium import webdriver

f = open('C:/Users/ahmed/Documents/GitHub/ltrbx/processed_posts.json','r',encoding='utf-8')
#f = open('C:/Users/ahmed\Documents/GitHub/ltrbx/test_posts.json', 'r', encoding='utf-8')
parent = 'C:/Users/ahmed/Downloads/letterboxd_fig_images'
img_constraints = 's1280x1920'
data = json.load(f)
f.close()

def downloadImage( path, figure ):

    # need to download the photo at the img_src link and save it as an image here
    img_name = figure['name']
    img_link = figure['img_src']

    # first check if its the correct tumblr format for example
    # 53a016ae7e13f725bad6a13c171fea4f/02ab647f4d955329-00/s1280x1920/c7eedad5b9199545bea47be17f8813561b229919.jpg
    # the other format is
    # 468ea81fe7e5f1394d6e5aed554e00c7/tumblr_pw7frwKMAd1qzeraeo1_1280.jpg
    isCorrectFormat = True
    if 'youtube' in img_link or 'primer.cf' in img_link:
        isCorrectFormat = False
    
    # we need to parse the image to make sure we get the largest picture possible
    if isCorrectFormat:
        split_url = img_link.split('/')
        
        #print(len(split_url))
        if( len(split_url) == 7 ):
            split_url[len(split_url)-2] = img_constraints
            img_link = '/'.join(split_url)
        else:
            if not ( img_link.endswith('1280.jpg') ):
                split_url = img_link.split('_')
                if img_link.endswith('.jpg'):
                    split_url[-1] = '1280.jpg'
                elif img_link.endswith('.png'):
                    split_url[-1] = '1280.png'
                elif img_link.endswith('.gif'):
                    split_url[-1] = '1280.gif'
                img_link = '_'.join(split_url)
        img_link = img_link.rstrip()
    print(img_link)

    # this just makes sure the image has the same file-type as its intended to
    if img_link.endswith('.jpg'):
        img_name += '.jpg'
    elif img_link.endswith('.png'):
        img_name += '.png'
    elif img_link.endswith('.gif'):
        img_name += '.gif'
    figure_path = os.path.join( path, img_name )

    # if its already downloaded then skip everything
    if( os.path.isfile(figure_path) or isCorrectFormat == False ):
        return


    if 'header' in img_name:
        # use urllib to download
        #print('header')
        request.urlretrieve(img_link,figure_path)
    else:
        # use selenium then urllib
        #print('selenium')
        driver = webdriver.Firefox()
        driver.get(img_link)
        src = driver.find_element_by_css_selector("._2nKI6")
        imgSrc = src.get_attribute('src')
        request.urlretrieve(imgSrc, figure_path)
        driver.close()


# progressbar i got from stackoverflow
def progressbar(it, prefix="", size=60, file=sys.stdout):
    count = len(it)
    if count == 0:
        return
    def show(j):
        x = int(size*j/count)
        file.write("%s[%s%s] %i/%i\r" % (prefix, "#"*x, "."*(size-x), j, count))
        file.flush()        
    show(0)
    for i, item in enumerate(it):
        yield item
        show(i+1)
    file.write("\n")
    file.flush()

# this will be the function that saves all the images to the file location
def writeFigures( path, figure ):
    directory = figure['name'] + '.txt'
    figure_path = os.path.join( path, directory )
    downloadImage( path, figure )


# this will setup all the folders for each post
def startProcess(post):
    directory = post['stripped_title']
    path = os.path.join( parent, directory )
    
    # if its a folder already then dont make a new folder
    if( os.path.isdir(path) == False ):
        os.mkdir(path)

    for i in post['figures']:
        writeFigures( path, i )



# this will delete all the folders and their contents
def deleteProcess(post):
    directory = post['stripped_title']
    path = os.path.join( parent, directory )
    shutil.rmtree(path)


# either will delete or start each folder
def start():
    for i in progressbar( data, "totalPosts: ",40):
            #deleteProcess(i)
            startProcess(i)


start()