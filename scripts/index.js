// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('description');
var titleInput = document.getElementById('title');
var imageInput = document.getElementById('image_url');
var priceInput = document.getElementById('price');
var signInGmail = document.getElementById('sign-in-gmail');
var signInFacebook = document.getElementById('sign-in-facebook');
var signInTwitter = document.getElementById('sign-in-twitter');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addPost = document.getElementById('add-post');
var addButton = document.getElementById('add');
var recentPostsSection = document.getElementById('recent-posts-list');
var userPostsSection = document.getElementById('user-posts-list');
var recentMenuButton = document.getElementById('menu-recent');
var myPostsMenuButton = document.getElementById('menu-my-posts');

var listeningFirebaseRefs = [];
//Write
function writeNewPost(uid,name,img_url, price,description) {
  // A post entry.
  var postData = {
    uid:uid,
    name:name,
    img_url: img_url,
    price: price,
    start_time: firebase.database.ServerValue.TIMESTAMP,
    end_time:7,
    description:description
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('Product').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/Product/' + newPostKey] = postData;
  updates['/user-products/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}


function createPostElement(postId, title,price, text, img_url) {
  var uid = firebase.auth().currentUser.uid; //return the unique id of the authenticated user

    //Dynamically create a card containing a Product
      var html = '<div class=" post post-' + postId + ' mdl-card mdl-cell  mdl-cell mdl-cell--12-col'+ ' mdl-cell--6-col-tablet mdl-cell--4-col-desktop  mdl-shadow--2dp">'+
				'<div class="mdl-card__media">'+
					'<img class="avatar "src="" alt="" width="100%!important"/>'+
				'</div>'+
			'	<div class="mdl-card__supporting-text">'+
					'<h1 class="mdl-card__title-text"></h1>'+
				'</div>'+
				'<div class="mdl-card__supporting-text">'+
					//'<p class="text"></p>'+
				'</div>'+
				//'<div class="mdl-card__actions mdl-card--border">'+
    '<div class="add-bid" action="#">' +
            '<div class="mdl-textfield mdl-js-textfield">' +
              '<input class="mdl-textfield__input new-bid" type="text">' +
              '<label class="mdl-textfield__label">Make Bid...</label>' +
            '</div>' +
            '</div>' +
        '<div class="mdl-layout-spacer"></div>'+
    	'Highest Bid:<p class="price"></p>'+
		'End Bid Date:<p class="date"></p>'+
	  '</div>'+
			'</div>'


  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;//assign the newly created card div to div
  var postElement = div.firstChild;

  if (componentHandler) {
    componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
  }

  
  var addBidForm = postElement.getElementsByClassName('add-bid')[0];
  var BidInput = postElement.getElementsByClassName('new-bid')[0];
 

  // Set the values.
 // postElement.getElementsByClassName('text')[0].innerText = text;
  postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("'+img_url+'")';
  postElement.getElementsByClassName('price')[0].innerText = price;
  // Listen for bids.
  // [START child_event_listener_recycler]
  var bidsRef= firebase.database().ref('Bids');
bidsRef.on('child_added', function(data) {
      console.log( data.val().bidValue);
     addBid(postElement, data.val().bidValue);   
     
  });

bidsRef.on('child_changed', function(data) {
    
  });

bidsRef.on('child_removed', function(data) {
   
  });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(bidsRef);


  // Create new Bid
  addBidForm.onsubmit = function(e) {
    e.preventDefault();
    createNewBid(postId,firebase.auth().currentUser.displayName, uid,BidInput.value);
   BidInput.value = '';
   BidInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  };



 

  return postElement;
} 



function createNewBid(postId,username,uid,price) {
  firebase.database().ref('Bids/'+postId).push({
    user: username,
    uid: uid,
    bidValue:price
  });
}

function addBid(postElement,value) {

postElement.getElementsByClassName('price')[0].innerText = value;

}



/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  // [START my_top_posts_query]
  var myUserId = firebase.auth().currentUser.uid;

  var recentPostsRef = firebase.database().ref('Product').limitToLast(100);//return only the first 100 Product
  var userPostsRef = firebase.database().ref('user-products/' + myUserId);

  var fetchPosts = function(postsRef, sectionElement) {
    postsRef.on('child_added', function(data) {
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
          createPostElement(data.key, data.val().name,data.val().price,data.val().description, data.val().img_url),
          containerElement.firstChild);
    });
    postsRef.on('child_changed', function(data) {	
		var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
		
    });
    postsRef.on('child_removed', function(data) {
	
    });
  };

  // Fetching and displaying all posts of each sections.

  fetchPosts(recentPostsRef, recentPostsSection);
  fetchPosts(userPostsRef, userPostsSection);

  // Keep track of all Firebase refs we are listening to.

  listeningFirebaseRefs.push(recentPostsRef);
  listeningFirebaseRefs.push(userPostsRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed posts.
 
  recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;




function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}



function newPostForCurrentUser(title,image,price, text) {
  var userId = firebase.auth().currentUser.uid;//the unique id of the authenticated user
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = snapshot.val().username;
    return writeNewPost(firebase.auth().currentUser.uid,title,image,price, text);

  });

}
/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  recentPostsSection.style.display = 'none';
  userPostsSection.style.display = 'none';
  addPost.style.display = 'none';
  recentMenuButton.classList.remove('is-active');
  myPostsMenuButton.classList.remove('is-active');


  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}

//Function to signInUser using their respective providers
function signInUser(provider,buttonName){
    buttonName.addEventListener('click',function(){
        firebase.auth().signInWithPopup(provider);
    });


}
//Sign out Authenticated User
function signOutUser(buttonName){
    buttonName.addEventListener('click',function(){
        firebase.auth().signOut();
    });
}





// Bindings on load.
window.addEventListener('load', function() {
  //Actually the starting point of this app
  // Bind all the Sign in buttons.
    signInUser(new firebase.auth.GoogleAuthProvider(),signInGmail);
    signInUser(new firebase.auth.FacebookAuthProvider(), signInFacebook);
    signInUser(new firebase.auth.TwitterAuthProvider(), signInTwitter);

  // Bind Sign out button.
    signOutUser(signOutButton);

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Saves message on form submit.
  messageForm.onsubmit = function(e) {
    e.preventDefault();
    var text = messageInput.value;
    var title = titleInput.value;
    var price = priceInput.value;
    var image = imageInput.value;
    if (text && title && price && image ) {
      newPostForCurrentUser(title,image,price, text).then(function() {
        myPostsMenuButton.click();
      });
      messageInput.value = '';
      titleInput.value = '';
    }
  };

  // Bind menu buttons.
  recentMenuButton.onclick = function() {
    showSection(recentPostsSection, recentMenuButton);
  };
  myPostsMenuButton.onclick = function() {
    showSection(userPostsSection, myPostsMenuButton);
  };
  
  addButton.onclick = function() {
    showSection(addPost);
    messageInput.value = '';
    titleInput.value = '';
  };
  recentMenuButton.onclick();
}, false);

