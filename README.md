# Letterboxd, by Ahmed
This will get the letterboxd posts from the tumblr API and then it parses all the raw posts into a more concise JSON form. Then it will download all the photos needed for the figures. 

*NOTE* THE ONLY THING NEEDED, IS TO WRITE A SCRIPT TO CHANGE THE IMAGE URL OF THE FIGURES ONCE IT IS HOSTED SOMEWHERE OTHER THAN TUMBLR. 

## How to run the code
1. Run fetch_JSON_file.js, this retrieves the raw json files from the tumblr api and store in raw_posts.json
2. Run parse_JSON_file.js, this will parse all the raw json posts and make a new concice processed_posts.json
3. Run getImages.py, this script downloads all the images from the tumblr urls, this does take time to finish, because each photo has to be opened in browser to download.
