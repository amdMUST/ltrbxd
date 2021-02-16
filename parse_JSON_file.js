/*
    This will take the json data we ingested from the tumblr api, and will post by post look through them and extract the most important
    bits of data, then it will write all this data to a new JSON file called "cleaned_posts.json"
*/

// this lets me read the json file and store each element into an array
const fs = require('fs');
var raw_posts = [];
var processed_posts = [];
let rawdata = fs.readFileSync('raw_posts.json');
let rawdata2 = fs.readFileSync('example_posts.json');
raw_posts = JSON.parse(rawdata);
console.log( 'total posts: ' + raw_posts.length );

var index = 0;

raw_posts.forEach( processPost );
/*
//processPost( raw_posts[0] );
//*/

// now we take those processed posts and write them to a json file
writePosts( processed_posts );

// this will be the main method that gets the data how we want it
function processPost( raw_post ){

    var cleaned_post = new Object();
    // we need to parse it for tags and stuff add those tags to new object
    cleaned_post = parsePost( raw_post, cleaned_post );
    
    
    //console.log( 'strippedtitle - ' + cleaned_post.stripped_title );
    //console.log( 'post-script - ' + cleaned_post.post_script );
    console.log( cleaned_post.title + ' - post ' + index++ + '\n' + cleaned_post.title_link + '\n' );
    
    // put new object into cleaned_post array
    if( cleaned_post != null ){
        processed_posts.push(cleaned_post);
    }
}


// this will parse through the raw post and add the important parts to the cleaned post
function parsePost( raw_post, cleaned_post ){

    var postScript_found = false;
    var photos = [];
    if( raw_post.photos != null )
        photos.push(raw_post.photos);


    // first we will add the basic things like date posted, tags, summary and post author
    cleaned_post.title = '';
    cleaned_post.html_title = '';
    cleaned_post.stripped_title = '';
    cleaned_post.title_link = '';
    cleaned_post.post_author = raw_post.post_author;
    cleaned_post.date_posted = raw_post.date;
    cleaned_post.quote = '';
    cleaned_post.post_script = '';
    cleaned_post.tags = raw_post.tags;
    cleaned_post.photos = photos;
    cleaned_post.figures = [];
    cleaned_post.embedded_tweets = [];
    cleaned_post.related_content = [];
    cleaned_post.summary = raw_post.summary;
    cleaned_post.sub_title = '';
    
    // some posts do not have captions so in that case, we will use the body identirfier
    // here is where we will go into the caption to parse the other information we will need
    if( raw_post.caption == null ){
        cleaned_post = parseCaption( raw_post.body, cleaned_post, raw_post, postScript_found );
    }
    else if( raw_post.caption == null && raw_post.body == null ){
        return;
    }
    else{
        cleaned_post = parseCaption( raw_post.caption, cleaned_post, raw_post, postScript_found );
    }
    
    return cleaned_post;
}


// here is where we will go into the caption to parse the other information we will need
function parseCaption( caption , cleaned_post, raw_post, postScript_found ){
    cleaned_post.sub_title = '';
    cleaned_post.abstract = '';
    cleaned_post.body = '';
    //console.log(caption)

    // this will find the title and subtitle
    findTitles(caption, cleaned_post, raw_post);

    // will return a new caption, without all the figures and stuff
    findFigures( caption, cleaned_post );

    //need to find the related content
    findRelatedContent( caption, cleaned_post );

    // here we are going to add the first photo as a figure
    parsePhotos( raw_post.photos, cleaned_post );

    // this will get the body of the article
    findBody( cleaned_post.body, cleaned_post, postScript_found );
    
    return cleaned_post;
}


// this will find the title and the subtitle of the article
function findTitles( caption, cleaned_post, raw_post ){

    // THIS PART LOOKS FOR THE TITLE
    var title = [];

    if( raw_post.title != null ){
        
        //console.log( 'raw post' );
        cleaned_post.title = raw_post.title;
        cleaned_post.html_title = raw_post.title;
        cleaned_post.title_link = raw_post.post_url;

        var stripped_title = cleaned_post.title.split(' ').join('');
        stripped_title = stripped_title.replace(/\W/g, '');  
        // this is to make the format of the stripped title more structured
        // console.log( stripped_title );
        var shortendDate = cleaned_post.date_posted;
        var dateArr = shortendDate.split(' ');
        shortendDate = dateArr[0];
        shortendDate = shortendDate.replace(/-/g,'');

        var shortendTitle = stripped_title;
        if( stripped_title.length > 17 ){
            shortendTitle = shortendTitle.substring(0,16);
        }
        stripped_title = shortendDate + '_' + shortendTitle;


        cleaned_post.stripped_title = stripped_title;
    }
    else{
        var title = caption.split( /<h1(.*?)><\/h1>/ );
        //console.log( 'findtitle title[1]: ' + title[1] );

        // class="post-title"><b> 22, we are assuming ever post has this same class begining
        // they all end with </b 3
        var parsedTitle;
        if( title[1] == null ){
            
            // assigns the date to the title
            // console.log( stripped_title );
            var shortendDate = cleaned_post.date_posted;
            var dateArr = shortendDate.split(' ');
            shortendDate = dateArr[0];
            shortendDate = shortendDate.replace(/-/g,'');

            cleaned_post.title = '';
            cleaned_post.stripped_title = shortendDate + '_' + 'Post';

        }
        else{

            // this will parse the title and the link
            // instead of <a href="title_link"> title </a>, we will break it up into title and title_link
            parsedTitle = title[1].substring(23, title[1].length-3);
            //console.log( parsedTitle );

            linkArr = parsedTitle.split('"');
            var link = linkArr[1];
            //console.log(link);

            // this will get the title with no html
            var aTag = parsedTitle.split( />(.*?)\</ );
            var actual_Title = aTag[1];
            //console.log(aTag);

            // this will get the title with the html tags depending on what it starts with
            if( parsedTitle.startsWith('<a href=') ){
                //console.log('top');
                var f_title = parsedTitle.split( /<. href(.*?)>/ );    
            }
            else{
                // these cases start with href, no a tag
                var f_title = parsedTitle.split( /href(.*?)\">/ );
            }
            var html_title = f_title[2];
            //console.log(html_title);

            //take the </a> tag out of the title
            if( html_title != undefined ){
                f_title = html_title.split( /<\/a>/ );
                html_title = f_title[0];
                // gets rid of all tags except i and em in title
                html_title = html_title.replace( /<([^iem]*?)>/g, '' );
            }
            //console.log(html_title);

            var actualTitle = actual_Title.replace( /<(.*?)>/g, '');
            //console.log(actualTitle);
            //to handle the undefined edge cases
            var i = 1;
            if( actualTitle == '' ){

                //console.log('undefined right');
                actualTitle = aTag[3];
                //console.log( actualTitle );
            }

            if (html_title == undefined)
                html_title = actualTitle;


            var stripped_title = html_title.split(' ').join('');
            stripped_title = stripped_title.replace( /<(.*?)>/g, '');
            stripped_title = stripped_title.replace(/\W/g, '');      
            if( stripped_title == '' ){
                stripped_title = actualTitle.replace(/\W/g, '');
            }

            // if title doesnt end with . it means we need to use the html tag stripped of html tho
            if( !actualTitle.endsWith('\.') ){
                actualTitle = html_title.replace( /<(.*?)>/g, '');
            }
        
            if( actualTitle.includes('&amp;') ){
                actualTitle = actualTitle.replace('&amp;','&');
                html_title = html_title.replace('&amp;','&');;
                stripped_title = stripped_title.replace('amp','');; 
            }

            // this is to make the format of the stripped title more structured
            // console.log( stripped_title );
            var shortendDate = cleaned_post.date_posted;
            var dateArr = shortendDate.split(' ');
            shortendDate = dateArr[0];
            shortendDate = shortendDate.replace(/-/g,'');

            var shortendTitle = stripped_title;
            if( stripped_title.length > 17 ){
                shortendTitle = shortendTitle.substring(0,16);
            }
            stripped_title = shortendDate + '_' + shortendTitle;
            //console.log( stripped_title );

            cleaned_post.title = actualTitle;
            cleaned_post.html_title = html_title;
            cleaned_post.stripped_title = stripped_title;
            cleaned_post.title_link = link;
        }
    }

    // THIS PART LOOKS FOR THE SUBTILE
    var subtitle = '';
    theTag = caption.split(/<h2>(.*?)<\/h2>/);
    subtitle = theTag[1];
    //console.log( theTag );
    if( theTag.length == 1 ){
        //console.log('no subtitle');
        cleaned_post.sub_title = '';
    }
    else{
        //console.log('subtitle found');
        cleaned_post.sub_title = subtitle;
        cleaned_post.body = theTag[theTag.length-1];
    }
}


// this will go and add all figures to array and leave the string in between them as their index
function findFigures( caption, cleaned_post ){

    // check if there are any embedded tweets and add those to twitter part
    // if there are tweets we want to return new body with those taken out
    findEmbeddedTweets( caption, cleaned_post );

    // we will return array of figures that will each be objects
    var figure_objects = [];
    var figures_final = [];
    var split_point = /<img(.*?)>|<figure(.*?)><\/figure>|(<p style=.*?<\/p>)/g;
    var figures_raw = caption.split( split_point );
    figures_raw = figures_raw.filter( Boolean );
    //console.log(figures_raw);
    
    for( var i = 0; i < figures_raw.length; i++ ){
        var reg = /"tmblr-full|"image"|alt="|data-orig/g
        if( figures_raw[i].search(reg) != -1 )
            figures_final.push( figures_raw[i] );
    }

    // for each figure we will need to create an object with its values
    for( var i = 0; i < figures_final.length; i++ ){
        figure_objects.push( createFigure(figures_final[i], i, cleaned_post) );
    }

    //console.log( figure_objects );
    for( i in figure_objects ){
        cleaned_post.figures.push( figure_objects[i] )
    }
}


// for each figure we will need to create an object with its values
function createFigure( figureData, index, post ){

    index++;
    //console.log( figureData );

    var newFigure = new Object();
    newFigure.name = post.stripped_title + '_figure_' + index;
    newFigure.float = false;
    newFigure.width = 1280; //1920 CHANGE these to 9999 to find problem parsing
    newFigure.height = 1920; //1080 CHANGE these to 9999 to find problem parsing
    newFigure.caption = '';
    newFigure.img_src = '';

    // this will get the caption of the data if it has any
    var figure_caption = figureData.split( /[<i|<em|<small]>(.*?)<\/[i|em|small]/g ); //6, /<p(.*?)><\/p|[<i|em|small]>(.*?)<\/[i|em|small]/g
    figure_caption = figure_caption.filter( Boolean );
    newFigure.float = figureData.includes('float') ? true : false;

    //console.log( figure_caption );
    if( figure_caption.length <= 1 ){
        newFigure.caption = '';
    }
    else{
        // some captions dont have figure data and can get parsed incorecctly so this will hopefully catch that (Life in Film: daniel scheinert)
        var figure_constraint = figureData.search( /data-orig-/g );
        if( figure_constraint == -1 ){
            var new_cap = figure_caption[1].split( /style="(.*?)></g );
            //console.log( 'figure caption new_cap' );
            //console.log( new_cap );
            
            for( var i = 0; i < new_cap.length; i++ ){
                if( new_cap[i].includes( 'src="' )){
                    figure_caption = new_cap[i].split( /[<i|<em|<small]>(.*?)<\/[i|em|small]/g );
                    figure_caption = figure_caption.filter( Boolean );
                    //console.log( figure_caption );
                    break;
                }
            }

        }
        
        // this will capture all the html and take it away
        if( figure_caption.length <= 1 ){
            newFigure.caption = '';
        }
        else{

            // add everything except first exerpt, that will be the caption, then we strip it
            var cap = figure_caption[1];
            for( var i = 2; i < figure_caption.length; i++ ){
                cap += figure_caption[i].replace( /<(.*?)>|(>)|(<.*\S)/g , '');;
            }
            //console.log(cap);
            newFigure.caption = cap.replace( /(<.*?>)|<|>/g , '');
            
        }   
        //console.log( 'figure caption: ' + newFigure.caption );
    }

    // if the second part of arr is the caption, we can say that arr[0] will have all the figure elements
    var figure_html = figure_caption[0];
    //console.log( '\n figure html: ' + figure_html );

    // first check if it floats
    if( figure_html.includes('float') ){
        newFigure.float = true;
    }

    var height_arr = figure_html.split( /data-orig-height=(".*?")/ );
    var width_arr = figure_html.split( /data-orig-width=(".*?")/ );
    var src_arr = figure_html.split( /src="(.*?)"/ );
    
    // basically if its null then we have a paragraph image instead of figure image
    if( height_arr[1] != undefined ){
            
        var height = parseInt( height_arr[1].replace(/"/g,"") );
        var width = parseInt( width_arr[1].replace(/"/g,"") );
        var src = src_arr[1];
        //console.log( 'figure height: ' + height );


        newFigure.width = parseInt( width );
        newFigure.height = parseInt( height );
        newFigure.img_src = src;
    }
    else{
        // otherwise we will just ask for the 1920x1080 by default 
        var src = src_arr[1];
        newFigure.img_src = src;
    }
    
    //console.log( newFigure );
    return newFigure;
}


// this will see if there are any embedded tweets
function findEmbeddedTweets( caption, cleaned_post ){

    // we will return array of figures that will each be objects
    var embed_tweets = []; 
    var splitBody = caption.split( /(<blockquote.*?<\/script>)|(<blockquote.*?<\/blockquote>)/ );
    splitBody = splitBody.filter( Boolean );

    //going to take splitbody array and create embedded figures if they are embedded tweets
    //console.log(splitBody.length);
    //console.log(splitBody);
    if( splitBody.length == 1 ){
        cleaned_post.body = caption;
        return; // this means there are no embedded tweets at all here
    }

    var numOfTweets = 1;
    for( var i = 0; i < splitBody.length; i++ ){
        
        if( splitBody[i].search('twitter-tweet') != -1 ){
            embed_tweets.push( createEmbeddedTweet(splitBody[i], numOfTweets, cleaned_post) );
            numOfTweets++;
        }
    }

    //console.log( embed_tweets );
    for( i in embed_tweets ){
        cleaned_post.embedded_tweets.push( embed_tweets[i] )
    }
    return;
}


// will create tweet object which has name and src data as properties
function createEmbeddedTweet( figureData, index, cleaned_post ){
    
    var tweet = new Object();
    tweet.name = cleaned_post.stripped_title + '_embedded_tweet_' + index;
    tweet.src = figureData;

    return tweet;
}


// if we split at every figure then we can just call everything else the body, EXCEPT the related content
function findBody( caption, cleaned_post, postScript_found ){

    // this is to put the embedded tweets where they need to go
    var tweetlessbody = '';
    var splitBody = caption.split( /(<blockquote.*?<\/script>)|(<blockquote.*?<\/blockquote>)/ );
    splitBody = splitBody.filter( Boolean );
    var numOfTweets = 1;
    for( var i = 0; i < splitBody.length; i++ ){
        if( splitBody[i].search('twitter-tweet') != -1 ){
            tweetlessbody += ( '<!--tweet[' + numOfTweets + ']-->' );;
            numOfTweets++;
        }
        else{
            tweetlessbody += splitBody[i];
        }
    }
    //console.log( tweetlessbody );

    // this is going to take the figures out now
    var split_point = /<img(.*?)>|<figure(.*?)><\/figure>|(<p style=.*?<\/p>)/g;
    var figure_split = tweetlessbody.split( split_point );
    figure_split = figure_split.filter( Boolean );
    //console.log(figure_split);
    var body = '';

    // from prev find figures, we know all the odds are figures and evens are paragraphs
    var figureCount = 1;
    for( var i = 0; i < figure_split.length; i++ ){
        
        if( figure_split[i].search(/"tmblr-full|"image"|alt="|data-orig/g) != -1 ){
            body += ( '<!--figure[' + figureCount + ']-->' );
            figureCount++;
        }
        else{
            body += ( figure_split[i] );
        }
    }

    //console.log(body);
    var subtitle_end = body.search( /<\/h2>/ );

    //this is for older posts that dont have header titles
    if( subtitle_end == -1 ){
        subtitle_end = body.search( /<p>/ );
        var olderPost = true;
    }

    // resize the body according to if it has a subtitle, related start, and post script
    if( !olderPost ){
        body = body.substring( subtitle_end+5 ); // these will end with '</h2>' so 5 chars
    }
    else{
        body = body.substring( subtitle_end+3 ); // these will end with '<p>' so 3 chars
    }
    //console.log('body rn1 \n' + body);

    body = checkForFirstQuote(body, cleaned_post);
    //console.log('quote rn2 \n' + cleaned_post.quote);

    body = checkForPostScript(body, cleaned_post, postScript_found);    
    //console.log('body rn3 \n' + body);

    var abstract_end = body.search( /<!-- more -->/ );
    var abstract = body.substring( -1, abstract_end );
    
    /*
    console.log( 'findbody abstractend ' + abstract_end );
    console.log('findbody abstract \n' + abstract + '\n' );
    console.log('findbody \n' + body + '\n' );
    //*/

    cleaned_post.body = body;
    cleaned_post.abstract = abstract;
}


// check to see if last sentence of the body is a postscript
function checkForPostScript( body, cleaned_post, postScript_found ){

    // the postscript was already found in the related content
    if( postScript_found == true ){
        return body;
    }

    // we are going to split every sentence and if the last one is wrapped in em or i, that means it is a postscript
    var sentences = body.split(/<p>(.*?)<\/p>/);
    sentences = sentences.filter( Boolean );
    //console.log( sentences );

    // now we see if last sentence has <i> or <b> tags surounding it, meaning its a post script
    var lastSentence = sentences[sentences.length-1];
    if( lastSentence.startsWith('<i>') && lastSentence.endsWith('<\/i><br\/>') || lastSentence.startsWith('<em>') && lastSentence.endsWith('<\/em><br\/>') ){
        
        var postScript = sentences.pop();
        
        // now we have to take away the i or em tags from start and begining
        if( postScript.startsWith('<i>') ){
            postScript = postScript.substring( 3, postScript.length-10 );
        }
        else if( postScript.startsWith('<em>') ){
            postScript = postScript.substring( 4, postScript.length-11 );
        }
        //console.log( postScript );
        cleaned_post.post_script = postScript;

        // need to put body back together, also putting <p> and </p> around the sentences
        var newbody = '';
        for( var i = 0; i < sentences.length; i++ ){
            newbody += '<p>' + sentences[i] + '<\/p>';
        }
        return newbody;
    }
    else if( lastSentence.startsWith('<i>') && lastSentence.endsWith('<\/i>') || lastSentence.startsWith('<em>') && lastSentence.endsWith('<\/em>') ){
        
        var postScript = sentences.pop();
        
        // now we have to take away the i or em tags from start and begining
        if( postScript.startsWith('<i>') ){
            postScript = postScript.substring( 3, postScript.length-4 );
        }
        else if( postScript.startsWith('<em>') ){
            postScript = postScript.substring( 4, postScript.length-5 );
        }
        //console.log( postScript );
        cleaned_post.post_script = postScript;

        // need to put body back together, also putting <p> and </p> around the sentences
        var newbody = '';
        for( var i = 0; i < sentences.length; i++ ){
            newbody += ('<p>' + sentences[i] + '<\/p>');
        }
        return newbody;
    }
    else{
        //console.log( 'no postscript' );
        return body;
    }
}


// this will check if the first line is a quote and if so, we pull it out
function checkForFirstQuote( body, cleaned_post ){
    
    //console.log( body );
    // if the first part of body starts with blockquote, then that entire thing is a quote and rest is the real body
    if( body.search(/<blockquote>(.*?)<\/blockquote>/) == 0 ){

        quote_found = true;
        var quote_split = body.split( /<blockquote>(.*?)<\/blockquote>/ );
        quote_split = quote_split.filter( Boolean );
        var quote = quote_split[0];
        //console.log(quote_split);
        quote = quote.replace( /<([^a|i|em|b]*?)>/g, '' );
        cleaned_post.quote = quote;
        body = quote_split[1];

        // if there are more than 1 blockquotes in the post, post_example(4),
        // then this will add all the other figures as well to the body, because we only want the first one for the quote
        if( quote_split.length > 1 ){
            var v = 2
            while( v < quote_split.length ){

                if( v % 2 == 0 ){
                    body += ( '<blockquote>' + quote_split[v] + '<\/blockquote>' );
                }
                else{
                    body += quote_split[v];
                }
                v++;
            }
        }
    }
    //console.log('body rn4' + body);
    return body;
}


// this will find the related content of the article
function findRelatedContent( caption, cleaned_post ){

    var relatedContent = [];
    
    // this is where we find the related content tag
    var lookingFor = '<h2>Related content(.*?)<\/h2>';
    var theTag = caption.search(lookingFor);

    //console.log( 'findrelatedcontent thetag: ' + caption.substring(theTag) );
    // this means that there is no related content and we can stop
    if( theTag == -1 ){
        cleaned_post.related_content = relatedContent;
        cleaned_post.body = caption;
    }
    else{

        // we can edit the body here to not include this 
        cleaned_post.body = caption.substring( -1, theTag );

        // now we know everything after the tag is the list of related content
        var content = caption.substring( theTag , caption.length  );
        //console.log( content );

        // now we need to split these into an array for every <p>
        relatedContent = content.split( /<p>(.*?)<\/p>/ );
        relatedContent = relatedContent.filter( Boolean );
        //console.log( relatedContent );

        var count_of_i = 0;
        for( var i = 1; i < relatedContent.length; i++ ){
            
            //console.log( relatedContent[i] );
            if( relatedContent[i].startsWith('<i>') && relatedContent[i].endsWith('<\/i>') )
                count_of_i++;

            cleaned_post.related_content.push(relatedContent[i].replace( /<\/p>/g, ''));      
        }
        //console.log( cleaned_post.related_content );
        //console.log( cleaned_post.related_content.length );
        var content_len = cleaned_post.related_content.length;

        // checks if last related content is a post_script or not. if so, it gets added
        // also checks to see if all the related content is in italics if so then its not postscript
        if (
        (   ( cleaned_post.related_content[content_len-1].startsWith('<i>') && cleaned_post.related_content[content_len-1].endsWith('<\/i>') ) || 
            ( cleaned_post.related_content[content_len-1].startsWith('<em>') && cleaned_post.related_content[content_len-1].endsWith('<\/em>')) 
        ) && (count_of_i != content_len) ){

            // have to format this post script correctly
            var temp_post_script =  cleaned_post.related_content.pop();

            //console.log( 'findrelatedcontent: ' + temp_post_script );
            postScript_found = true;
            cleaned_post.post_script = temp_post_script;
        }
    }

}


// here is where we will take the title image and make it the first figure
function parsePhotos( photos , cleaned_post ){

    if( photos == null ){
        delete cleaned_post.photos;
        return;
    }

    var header_img = photos[0].original_size;
    //console.log( header_img );

    var newFigure = new Object();
    newFigure.name = cleaned_post.stripped_title + '_figure_header';
    newFigure.float = false;
    newFigure.width = header_img.width;
    newFigure.height = header_img.height;

    /*if( photos[0].caption != '' ){
        console.log('bruh')
        newFigure.caption = header_img.caption;
    }
    else{
        newFigure.caption = '';
    }*/
    newFigure.caption = '';
    newFigure.img_src = header_img.url;
    
    //console.log( newFigure );
    cleaned_post.figures.unshift( newFigure );
    //cleaned_post.figures.unshift( JSON.stringify(newFigure, null, 2) );

    delete cleaned_post.photos;
}


// this will write to a new json file with our processed arr
function writePosts( arr ){
    
    //console.log(arr);
    var fs = require("fs");
    let data = JSON.stringify( processed_posts, null, 3);
    fs.writeFileSync("processed_posts.json", data ,function ( err ){
        if( err ){
            return console.error(err);
        }
        console.log("Data has been written")
    });

}