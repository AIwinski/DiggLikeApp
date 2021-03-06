 $(window).ready(function(){
  $(".fb").attr("href",  "https://www.facebook.com/sharer/sharer.php?u=" + window.location.hostname + "%2Fposts%2Fdetails%2F" + $(".fb").attr("id"))
  $(".twitter").attr("href", "https://twitter.com/intent/tweet?text=" + window.location.hostname + "%2Fposts%2Fdetails%2F" + $(".twitter").attr("id"));
 });

 $(function(){
    $(".voteUp").click(function(e){
      e.preventDefault();

      if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }

      var data = {
        id: $(this).attr("id")
      }
      var up = "#" + data.id + ".voteUp";
      var down = "#" + data.id + ".voteDown";
      var punkty = "#" + data.id + ".punkty";

      $.ajax({
        type: "POST",
        url: "/posts/vote/" + $(this).attr("id") + "/up",
        data: data,
        success: function(data){
          if(data.success){
            var pkt = data.points;

            if($(up).hasClass("clicked")){
              $(up).removeClass("clicked");
            } else {
              $(up).addClass("clicked");
              $(down).removeClass("clicked");
            } 
            
            
            $(punkty).text(pkt);

          } else {
          }
        },
        error: function(){
          //alert("blad");
        }
      });

    });

    $(".voteDown").click(function(e){
      e.preventDefault();

      if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }

      var data = {
        id: $(this).attr("id")
      }
      
      var up = "#" + data.id + ".voteUp";
      var down = "#" + data.id + ".voteDown";
      var punkty = "#" + data.id + ".punkty";

      $.ajax({
        type: "POST",
        url: "/posts/vote/" + $(this).attr("id") + "/down",
        data: data,
        success: function(data){
          if(data.success){
            var pkt = data.points;
            if($(down).hasClass("clicked")){
              $(down).removeClass("clicked");
            } else {
              $(down).addClass("clicked");
              $(up).removeClass("clicked");
            } 
            
            $(punkty).text(pkt);

          } else {
          }
        },
        error: function(){
          //alert("blad");
        }
      });

    });

      $(".fav").click(function(e){
        e.preventDefault();


        if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }
        
        var data = {
            id: $(this).attr("id")
          }

          var fav = "#" + data.id + ".fav";

          $.ajax({
            type: "POST",
            url: "/posts/fav",
            data: data,
            success: function(data){
              if(data.success){
                $(fav).toggleClass("clicked");
              } else {
              }
            },
            error: function(){
              //alert("blad");
            }
          });
      });


$(".voteUpComm").click(function(e){
      e.preventDefault();

      if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }

      var data = {
        id: $(this).attr("id")
      }
      var up = "#" + data.id + ".voteUpComm";
      var down = "#" + data.id + ".voteDownComm";
      var punkty = "#" + data.id + ".punktyComm";

      $.ajax({
        type: "POST",
        url: "/posts/votecomment/" + $(this).attr("id") + "/up",
        data: data,
        success: function(data){
          if(data.success){
            var pkt = data.points;

            if($(up).hasClass("clickedComm")){
              $(up).removeClass("clickedComm");
            } else {
              $(up).addClass("clickedComm");
              $(down).removeClass("clickedComm");
            } 
            
            
            $(punkty).text(pkt);

          } else {
          }
        },
        error: function(){
          //alert("blad");
        }
      });

    });

    $(".voteDownComm").click(function(e){
      e.preventDefault();

      if($('a[href="/users/login"]').length > 0){
        window.location.href = window.location.origin + "/users/login";
      }

      var data = {
        id: $(this).attr("id")
      }
      
      var up = "#" + data.id + ".voteUpComm";
      var down = "#" + data.id + ".voteDownComm";
      var punkty = "#" + data.id + ".punktyComm";

      $.ajax({
        type: "POST",
        url: "/posts/votecomment/" + $(this).attr("id") + "/down",
        data: data,
        success: function(data){
          if(data.success){
            var pkt = data.points;
            if($(down).hasClass("clickedComm")){
              $(down).removeClass("clickedComm");
            } else {
              $(down).addClass("clickedComm");
              $(up).removeClass("clickedComm");
            } 
            
            $(punkty).text(pkt);

          } else {
          }
        },
        error: function(){
          //alert("blad");
        }
      });

    });
       
  });