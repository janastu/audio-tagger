(function(window) {

  window.audioSwtr = window.audioSwtr || {};

  //init App
  audioSwtr.init = function() {
    $.ajaxSetup({
      xhrFields: {
        // we need this to send cookies to cross-domain requests
        withCredentials: true
      },
      //some browsers won't make cross-domain ajax until it is explicitly set
      crossDomain: true
    });
    this.handleOAuth();
    this.app_router = new AppRouter();
    Backbone.history.start();
    this.app_router.start();
    $(".menu-toggle").click(function(e) {
        e.preventDefault();
        $(".wrapper").toggleClass("active");
        $('.side_name').toggleClass("active");
    });

  };


  audioSwtr.handleOAuth = function() {
    if(audioSwtr.access_token) {
      $('#signinview').html('Signing you in..');
      $.ajax({
        url: audioSwtr.swtstoreURL()+'/api/users/me?access_token='+
          audioSwtr.access_token,
        success: function(data) {
          audioTagApp.userLoggedIn(data.username);
        },
        error: function() {
          $('#signinview').html('Error signing in! Please try again');
        }
      });
    }
  };

  /* Model for audio Annotation Sweets */
  var AudioAnnoSwt = Backbone.Model.extend({
    defaults: {
      'who': '',
      'what': '',
      'where': '',
      'how': {}
    },
    initialize: function() {
    }
  });

  /* Collection to hold all multiple ImgAnnoSwt */
  audioSwtr.AudioAnnoSwts = Backbone.Collection.extend({
    model: AudioAnnoSwt,
    url: function() {
      return audioSwtr.swtstoreURL() + '/sweets';
    },
    // get all sweets/annotations of type #img-anno for a particular URI
    // (where)
    // @options is a javascript object,
    // @options.where : URI of the resource for which swts to be fetched
    // @options.who: optional username to filter sweets
    // @options.success: success callback to call
    // @options.error: error callback to call
    getAll: function(options) {
      // error checking
      if(!options.what) {
        throw Error('"what" option must be passed to get sweets of a URI');
        return false;
      }
      // setting up params
      var where = options.where || null,
          what = options.what,
          who = options.who || null;


      url = audioSwtr.swtstoreURL() + audioSwtr.endpoints.get + '?what=' +
        encodeURIComponent(what) + '&access_token=' + audioSwtr.access_token;

      if(who) {
        url += '&who=' + who;
      }
      if(where) {
        url += '&where=' + where;
      }
      // get them!
      this.sync('read', this, {
        url: url,
        success: function() {
          if(typeof options.success === 'function') {
            options.success.apply(this, arguments);
          }
        },
        error: function() {
          if(typeof options.error === 'function') {
            options.error.apply(this, arguments);
          }
        }
      });
    },
    // post newly created sweets to a sweet store
    // @options is a javascript object,
    // @options.where : URI of the resource for which swts to be fetched
    // @options.who: optional username to filter sweets
    // @options.success: success callback to call
    // @options.error: error callback to call,
    post: function(options) {
      var new_sweets = this.getNew();
      var dummy_collection = new Backbone.Collection(new_sweets);
      console.log('swts to be posted', dummy_collection.toJSON());

      if(!audioSwtr.access_token) {
        throw new Error('Access Token is required to sweet');
        return;
      }

      var url = audioSwtr.swtstoreURL() + audioSwtr.endpoints.post +
            '?access_token=' + audioSwtr.access_token;

      this.sync('create', dummy_collection, {
        url: url,
        success: function(options) {
          if(typeof options.success === 'function') {
            options.success.apply(this, arguments);
          }
        },
        error: function() {
          if(typeof options.error === 'function') {
            options.error.apply(this, arguments);
          }
        }
      });
    },
    // return newly created models from the collection
    getNew: function() {
      var new_models = [];
      this.each(function(model) {
        if(model.isNew()) {
          new_models.push(model);
        }
      });
      return new_models;
    },
    // update part of the collection after a save on the server
    update: function() {
    }
  });

  //testing audioSwtr
  audioSwtr.playArea = Backbone.View.extend({
    el: "#audio-play-area",
    events: {
      "click #submit-form" : "submitForm",
      "change input" : "emojiChange",
      "click .suggest-tag-item" : "addTagViz",
      "click .fav-button" : "favClick",
      "click .dislike-button" : "dislikeClick",
      "click #cancel-form" : "toggle"
    },
    initialize: function(options) {
        console.log(options);
       var modelId = options.id || '';
      this.model = audioTagApp.audioCollection.get(modelId);
      this.swtrTemplate = _.template($('#sweets-template').html());
      this.tagsListTemplate = _.template($('#tags-list-template').html());
      this.alertsTemplate = _.template($('#alert-template').html());
      this.listenTo(audioSwtr.storeCollection, 'add', this.swtsRender);
      this.render();
    },
    template: _.template($('#play-item-template').html()),
    render: function() {
        console.log("in play area");
        if(this.$el.is(':hidden')){
            this.toggle();
        }
      this.$el.html('');
      this.$el.append(this.template(this.model.toJSON()));
      $("body").scrollTop(0); //this.$el should do this, but unable to get it working
      this.$tags = $("#add-tag");
      this.$tags.tagsinput();
      //TODO: should figure our how to get inputs and build array
      this.swtsRender();
    },
    submitForm: function(event) {
      event.stopPropagation();
      audioTagApp.dashboard.playArea.$el.find('.alert').remove();
      if(audioSwtr.access_token){
          this.$tags = $("#add-tag");
          if(!(this.$el.find('input').val()=="")){
              this.newTags = this.$tags.tagsinput('items');
              console.log(this.newTags, "submit form");
              this.swtrBuild();
          }
      }
      else if(!audioSwtr.access_token) {
          this.$el.prepend(this.alertsTemplate({message: "You need to Sign In" }));
      }
    },
    swtrBuild: function() {
        var swt = [{
            who: audioSwtr.who,
            what: audioSwtr.allowedContexts,
            where: this.model.get('url'),
            how: {tags: this.newTags}
        }];
        audioSwtr.storeCollection.add(swt);
        //swts to be posted
        var swtsToPost = JSON.stringify(audioSwtr.storeCollection.getNew());
        audioSwtr.storeCollection.post(swtsToPost);
        this.render();
    },
    swtsRender: function() {
        //swts to render
        var swtsForAudio = audioSwtr.storeCollection.filter(function(swt) {
            if(this.model.get('url') == swt.get('where')){
                console.log("true");
                return swt;
            }
        }, this);
        console.log(swtsForAudio);
        var tags = [];
        _.each(swtsForAudio, function(swt) {
            if(swt.get('how').tags){
                tags.push(swt.get('how').tags);
                this.$el.append(this.swtrTemplate(swt.toJSON()));
            }
        }, this);
        tags = _.flatten(tags);
        tags= _.uniq(tags);
        this.$el.find('.tag-editor').append(this.tagsListTemplate({"tags": tags, "id": this.model.get('id')}));
    },
    addTagViz: function(event) {
        event.stopPropagation();
        var clickedTag = $(event.currentTarget).text();
        console.log(clickedTag);
        this.$el.find('input').val(clickedTag);
    },
    favClick: function(event) {
        event.stopPropagation();
        if(audioSwtr.access_token){
            var data = $(event.currentTarget).data('like');
            var audioModel = this.collection.get($(event.currentTarget).data("id"));
            //TODO: Bug: one user can send multiple like sweets for one audio
            //dom won't refresh(as required) - Swts get posted(should check
            //for users who have liked alread
            var swt = [{
                who: audioSwtr.who,
                what: audioSwtr.allowedContexts,
                where: audioModel.get('url'),
                how: {like: true}
            }];
            audioSwtr.storeCollection.add(swt);
            //swts to be posted
            var swtsToPost = JSON.stringify(audioSwtr.storeCollection.getNew());
            audioSwtr.storeCollection.post(swtsToPost);
            //TODO: after posting data, need to render view
            $(event.currentTarget).find('.feed-data').html(++data);
            $(event.currentTarget).attr('data-like', data);
            console.log("like", data);
            this.$el.prepend(this.alertsTemplate({message: "Swt posted to the Store" }));
        }
        else if(!audioSwtr.access_token) {
            this.$el.prepend(this.alertsTemplate({message: "You need to Sign In" }));
        }
    },
    toggle: function() {
        if(this.$el.is(':visible')) {
            this.$el.hide();
            console.log("visible");
        }
        else {
            this.$el.show();
            console.log("hidden");
        }
    }
  });

  //default audio collection, with file identifiers
  //like ID, date-time stamp, tags(if available)
  var audioCollection = Backbone.Collection.extend({
    model: Backbone.Model,
    initialize: function(options) {
      this.url = options.url;
    },
    comparator: function(model) {
      return -Date.parse(model.get("date"));
    }
  });


  //admin control panel
  //
  var adminDash = Backbone.View.extend({
    el: "#auth-form",
    events: {
      "click button": "authSubmit"
    },
    initialize: function() {
    },
    render: function() {
    },
    authSubmit: function() {
      $.ajax({
        type: 'POST',
        url: 'http://da.pantoto.org/api/user',
        data: {'usertel': $('#phone-number').val()},
        success: function(response) {
        },
        error: function() {
        }

      });

    }
  });


  //upload audio url view
  var uploadUrl = Backbone.View.extend({
    el: "#upload-form",
    events: {
      "click button" : "submitUrl"
    },
    initialize: function() {
      this.url = $('#upload-input').val();
    },
    render: function() {
    },
    submitUrl: function(event) {
      event.preventDefault();
      if(this.url){
        $.ajax({
          type: 'POST',
          url: 'http://da.pantoto.org/api/url',
          data: {'url': this.url },
          success: function(response) {
          },
          error: function() {
            console.log("caught error");
          }

        });
      }
    }
  });

  //Get request from the server endpoint
  //api:
  // list view for the audio files, sorted by date-time stamp
  // with other attributes from database
var dashboardview = Backbone.View.extend({
    events: {
        "click .feed-data .suggest-tag-item" : "searchTag",
        "click .add-tag-button" : "playClick",
        "click .fav-button" : "favClick",
        "click .share-button" : "shareClick",
        "click .dislike-button" : "dislikeClick"
    },
    initialize: function(options) {
        this.$sideMenu = $("#side-menu-wrap");
        this.alertsTemplate = _.template($('#alert-template').html());
        this.listenTo(this.collection, "set", this.render);
        if(this.$el.parent().siblings().is(':visible')){
            this.$el.parent().siblings().hide();
        }
    },
    template: _.template($('#audio-item-template').html()),
    dummyrender: function() {
       /* this.collection.each(function(item) {
            this.$el.append(this.template(item.toJSON()));
        }, this);
        $('[data-toggle="tooltip"]').tooltip();
        this.$sideMenu.BootSideMenu({
            side: "right",
            autoClose: true});*/
    },
    render: function() {
        this.collection.each(function(item) {
            var models = audioSwtr.storeCollection.filter(function(swt) {
                if(_.isEqual(item.get('url'), swt.get('where'))){
                    return swt;
                }
            });
            var likes = [];
            var dislikes = [];
            var tags= [];
            if(models) {
                _.each(models, function(model) {
                    if(model.get('how').like == true) {
                        likes.push(model.get('who'));
                    }
                    else if(model.get('how').dislike == true) {
                        dislikes.push(model.get('who'));
                    }
                    else if(model.get('how').tags){
                        tags.push(model.get('how').tags);
                    }
                });
            }
            var uniqueTags = _.uniq(_.flatten(tags));
            this.$el.append(this.template({
                id: item.get('id'),
                url: item.get('url'),
                uploadDate: item.get('uploadDate'),
                tags: uniqueTags,
                taglen: uniqueTags.length,
                likes: likes.length,
                dislikes: dislikes.length
            }));
        }, this);
    },
    playClick: function(event) {
        event.preventDefault();
        this.playArea = new audioSwtr.playArea({id: $(event.currentTarget).data("id")});
        //audioSwtr.app_router.play({id: $(event.currentTarget).data("id")});
        this.toggle();
    },
    favClick: function(event) {
        event.stopPropagation();
        if(audioSwtr.access_token){
            var data = $(event.currentTarget).data('like');
            var audioModel = this.collection.get($(event.currentTarget).data("id"));
            //TODO: Bug: one user can send multiple like sweets for one audio
            //dom won't refresh(as required) - Swts get posted(should check
            //for users who have liked already
            var swt = [{
                who: audioSwtr.who,
                what: audioSwtr.allowedContexts,
                where: audioModel.get('url'),
                how: {like: true}
            }];
            audioSwtr.storeCollection.add(swt);
            //swts to be posted
            var swtsToPost = JSON.stringify(audioSwtr.storeCollection.getNew());
            audioSwtr.storeCollection.post(swtsToPost);
            //TODO: after posting data, need to render view
            $(event.currentTarget).find('.feed-data').html(++data);
            $(event.currentTarget).attr('data-like', data);
            console.log("like", data);
        }
        else {
        this.$el.find('.alert').remove();
        this.$el.prepend(this.alertsTemplate({message: "You need to Sign In" }));
        }
    },
    shareClick: function(event) {
        var data = $(event.currentTarget).data('forward');
        console.log("forward", data);
    },
    dislikeClick: function(event) {
        event.stopPropagation();
        if(!audioSwtr.access_token){
            this.$el.prepend(this.alertsTemplate({message: "You need to Sign In" }));
        }
        var data = $(event.currentTarget).data('dislike');
        var audioModel = this.collection.get($(event.currentTarget).data("id"));
        var swt = [{
            who: audioSwtr.who,
            what: audioSwtr.allowedContexts,
            where: audioModel.get('url'),
            how: {dislike: true}
        }];
        audioSwtr.storeCollection.add(swt);
        //swts to be posted
        var swtsToPost = JSON.stringify(audioSwtr.storeCollection.getNew());
        audioSwtr.storeCollection.post(swtsToPost);
        //TODO: after posting data, need to render view
        $(event.currentTarget).find('.feed-data').html(++data);
        $(event.currentTarget).attr('data-dislike', data);
        console.log("dislike", data);
    },
    searchTag: function(event) {
        event.stopPropagation();
        this.searchView = new searchTagView({keyword : ($(event.currentTarget).text())});
        console.log ($(event.currentTarget).text().trim());
    },
    toggle: function() {
        if(this.$el.is(':visible')) {
            this.$el.hide();
            console.log("visible");
        }
        else {
            this.$el.show();
            console.log("hidden");
        }
    }


});

  var searchTagView = Backbone.View.extend({
    el: "#search-results-container",
    template: _.template($('#search-results-template').html()),
    events: {
      "click .recent-feed-data": "callPlayArea"
    },
    initialize: function(options) {
        //_.bindAll(this, 'callPlayArea');
        this.keyword = options.keyword || '';
        this.searchHeaderTemplate = _.template($('#search-header-template').html());
        console.log(options);
        this.listenTo(audioSwtr.storeCollection, "add", this.render);
        this.render();
    },
    render: function() {
      $(this.el).html('');
      this.searchResults = audioSwtr.storeCollection.filter( function(swt) {
        console.log(this.keyword, swt);
        if(_.contains(swt.get('how').tags, this.keyword )){
          return swt;
        }
      }, this);
      if(this.keyword){
           this.$el.prepend(this.searchHeaderTemplate({message: "<h3>"+this.keyword+" </h3> has <h3>"+this.searchResults.length+"</h3> messages" }));
        }
      console.log(this.searchResults);
      //bug - need to fix
      if(audioTagApp.dashboard.$el.is(':visible')) {
        audioTagApp.dashboard.toggle();
      }
      _.each(this.searchResults, function(item) {
        $(this.el).append(this.template(item.toJSON()));
      }, this);
    },
    callPlayArea: function(event) {
      event.stopPropagation();
      if(!audioTagApp.dashboard.playArea){
      this.playArea = new audioSwtr.playArea({id: $(event.currentTarget).data("id")});
      //this.playArea = new audioPlayArea({$(event.currentTarget).data("id")});
      }
      audioTagApp.dashboard.playArea({id: $(event.currentTarget).data("id")});
      //new audioPlayArea({model: this.collection.get($(event.currentTarget).data("id"))});
    },
    toggle: function() {
      if(this.$el.is(':visible')) {
        this.$el.hide();
        console.log("visible");
      }
      else {
        this.$el.show();
        console.log("hidden");
      }
    }
  });


  //visualization for tags, user and other file attributes
  // to be extended with drag and drop to tagsinput field
  var tagCloudView = Backbone.View.extend({
    el: "#tag-cloud",
    events: {
      "click span" : "searchTag"
    },
    initialize: function() {
      this.$tagClouds = $("#tag-clouds");
      this.$searchForm = $("#input-keyword");
      this.listenTo(audioSwtr.storeCollection, "add", this.render);
    },
    render: function() {
        var wordArray = _.chain(this.collection.pluck('how')).pluck('tags').flatten().compact().countBy().map(function(val, key){
            return {text: key, weight:val};
        });
        this.$el.jQCloud(wordArray._wrapped);
    },
    searchTag: function(event) {
      event.preventDefault();
      this.searchView = new searchTagView({keyword:($(event.currentTarget).text())});
    }

  });

var appview = Backbone.View.extend({
    el: $('body'),
    events:{
        "click #homeAnchor": "callDashboard",
        'click #sign-in': 'signIn'
    },
    initialize: function(options) {
        _.bindAll(this, 'callDashboard');

        // initialize the oauth stuff
        this.oauth = new Oauth({
            app_id: audioSwtr.app_id,
            endpoint: audioSwtr.swtstoreURL() + audioSwtr.endpoints.auth,
            redirect_uri: audioSwtr.oauth_redirect_uri,
            scopes: 'email,sweet,context'
        });
        audioSwtr.storeCollection = new audioSwtr.AudioAnnoSwts();
        this.audioCollection = new audioCollection({ url: "http://da.pantoto.org/api/files"});
        this.audioCollection.fetch({
            success: function(collection, response) {
                collection.set(response.files);
                audioTagApp.getSweets();
            },
            error: function(collection) {
                console.log("Error!! Error!!", collection);
            }
        });
        this.render();
    },
    getSweets: function() {
        audioSwtr.storeCollection.getAll({
            what: audioSwtr.allowedContexts,
            where: null,
            success: function(data) {
                audioSwtr.storeCollection.add(data);
                audioTagApp.dashboard.render();
            }
        }, this);
    },
    filterSocialData: function() {
        this.socialData = audioSwtr.storeCollection.filter(function(item){
            if(!item.get('how').tags) {
                return item
            }
        });
    },
    render: function(){
      this.dashboard = new dashboardview({el:"#dashboard-body",
                                          collection: this.audioCollection });
      this.tagCloud = new tagCloudView({collection: audioSwtr.storeCollection});
    },
    signIn: function(event) {
        event.preventDefault();
        console.log("calling sign in");
        // if user is Guest.. sign them in..
        // if(audioSwtr.who === 'Guest') {
        //     console.log("authorizing");
        this.oauth.authorize();
        // }
        // return false;
    },
    userLoggedIn: function(username) {
        audioSwtr.who = username;
        var text = 'Signed in as <b><u>' + audioSwtr.who + '</u></b>';
        $('#signinview').html(text);
        // $.ajax({
        //   url:"http://locahost:5001/api/sweets/q?access_token="+audioSwtr.access_token,
        //   type: 'POST',
        //   crossDomain:true,
        //   data:[{who:'arvindkhadri',
        //          what:'img-anno',
        //          'where':'http://localhost:5000',
        //          how:{}}]
        // });
    },
    userLoggedOut: function() {
        swtr.who = 'Guest';
        $('#signinview').html('Logged out');
    },
    callDashboard: function(event) {
        if(audioTagApp.dashboard.$el.is(':hidden')) {
            audioTagApp.dashboard.toggle();
            audioTagApp.dashboard.playArea.toggle();
            audioSwtr.app_router.navigate('home', {trigger: true});
            //audioTagApp.tagCloud.searchView.$el.html('');
        }
    }
});


var AppRouter = Backbone.Router.extend({
    routes: {
        'home': 'home',
        'play': 'play',
        'search' : 'search'
    },
    home: function(params) {
        this.navigate('home');
        audioTagApp.dashboard;
        audioTagApp.tagCloud;
    },
    play: function(params) {
        if(!audioSwtr.acces_token) {
            console.log("you have to be logged in");
        }
        console.log(audioSwtr.acces_token);
        this.play_area = new audioSwtr.playArea(audioTagApp.audioCollection.get(params.id));
        this.navigate('play');
        console.log(params);
    },
    search: function() {
    },
    start: function() {
        var fragment = window.location.hash.split('#')[1];
        if(!fragment) {
            this.navigate('home', {trigger: true});
            return;
        }
        var route = fragment.split('/')[1];
        if(_.indexOf(_.keys(this.routes), route) > -1) {
            this.navigate(fragment, {trigger: true});
        }
    },
});

audioTagApp = new appview;
window.onload = function() {
    audioSwtr.init();
};
})(window);
