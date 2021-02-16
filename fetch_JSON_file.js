let tumblr_api_key = "api_key=HrmmfaRpTugiVX2R6znMylPhSqCllLTiBiVK9B4bTWtBzffi8g";
let letterboxd_address = "letterboxd.tumblr.com/posts?";
let barebones_Url = "https://api.tumblr.com/v2/blog/ "+ letterboxd_address + tumblr_api_key;
const fetch = require("node-fetch");
const { stringify } = require("querystring");

// I need to be able to make a request with these things
// we know the total posts is at 221 rn, so 250 is safe to assume as ceiling
const limit = 50;
var optionals = "&limit=" + limit + "&offset=";
var url = barebones_Url + optionals;
    

// i want to have one array be the one i use to ingest new posts where the other one is the main array
var posts_arr = [];
var ingest_arr = [];


// this is the function that requests from tumblr when you press the button
function request_from_tumblr(){

    Promise.all([
        fetch( url + 0 ),
        fetch( url + 50 ),
        fetch( url + 100 ),
        fetch( url + 150 ),
        fetch( url + 200 )
    ]).then( function (responses) {
        
        // get a JSON object from each of the responses
        return Promise.all( 
            responses.map(
                function (response){
                    return response.json();
                }
            )
        );
    })
    .then( function (data) {
        
        // this starts ingestation for our array of requests
        console.log(data);
        data.forEach(startIngestation);
        //showAllPosts();
        writeToFile();
    })
    .catch( function (error) {
        
        // catch errors
        console.log(error);
    })
    
}

// this will populate our array to the fullest, adding this ingest_arr to the big final posts_arr
function startIngestation( response_from_tumblr ){
    ingest_arr = response_from_tumblr.response.posts;
    posts_arr.push(...ingest_arr);
    //ingest_arr.forEach(writeToFile);
}

// this writes all the raw data to a json file where later we can parse through it
function writeToFile(  ){
    var fs = require("fs");
    let data = JSON.stringify( posts_arr, null, 3)
    fs.writeFileSync("raw_posts.json", data ,function ( err ){
        if( err ){
            return console.error(err);
        }
        console.log("Data has been written")
    });

}


// this is a helper function that eventually prints all the posts
function showAllPosts(){
    //posts_arr.forEach(createDivs);
    //posts_arr.forEach(printCaption);
    //posts_arr.forEach(writeToFile);
}

// this will go through our array "posts_arr", and print all of the posts at each index
function printCaption( post, index ){
    
    var divName = "div_Post_" + index;

    if( post.caption != null ){
        document.getElementById(divName).innerHTML += post.caption + "<br><hr><br>";
    }
    else{
        document.getElementById(divName).append( post.title );
        document.getElementById(divName).innerHTML += post.body + "<br><hr><br>";
    }

}

// this will create a new div for each one of our posts to keep track of
function createDivs( post, index ){
    
    var divName = "div_Post_" + index;
    const newDiv = document.createElement( divName );
    const currentDiv = document.getElementById("theArray");

    newDiv.setAttribute("id", divName);
    newDiv.setAttribute("class", "posts_List");
    document.body.insertBefore( newDiv, currentDiv );

    // create the pic for the main image, should be inside a link
    if( post.photos != undefined ){
        
        if( post.link_url != undefined ){
            var link = document.createElement("a");
            link.href = post.link_url;
            var postMainImg = document.createElement("img");
            link.appendChild(postMainImg);

            postMainImg.setAttribute("class", "title_Image");
            postMainImg.src = post.photos[0].original_size.url;
            document.getElementById( divName ).appendChild( link );
        }
        else{
            var postMainImg = document.createElement("img");
            postMainImg.setAttribute("class", "title_Image");
            postMainImg.src = post.photos[0].original_size.url;
            document.getElementById( divName ).appendChild( postMainImg );    
        }
    }
    
}

request_from_tumblr();