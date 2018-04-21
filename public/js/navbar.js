

jQuery(document).ready(function(){
      console.log(categories);
      var path = window.location.pathname;
      // var pathName = path.substring(0, path.lastIndexOf('/') + 1);
      // console.log(pathName);
      var pathName = path;    
      if(pathName === "/"){
      	pathName = "/posts/all";
      	$("#24h").attr("href", pathName + "/24h");
      	$("#48h").attr("href", pathName + "/48h");
      	$("#72h").attr("href", pathName + "/72h");
      	return;
      } else {
      	if(pathName.includes("/24h") || pathName.includes("/48h") || pathName.includes("/72h")){
      		pathName = path.substring(0, path.lastIndexOf('/') + 1);
      		$("#24h").attr("href", pathName + "24h");
      		$("#48h").attr("href", pathName + "48h");
      		$("#72h").attr("href", pathName + "72h");
      		return;
      	}
      	$("#24h").attr("href", pathName + "/24h");
      	$("#48h").attr("href", pathName + "/48h");
      	$("#72h").attr("href", pathName + "/72h");
      }
    });