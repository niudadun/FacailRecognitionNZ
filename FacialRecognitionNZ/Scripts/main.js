$(document).ready(function () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    $("#search_Button").hide();
    $("#upload_Image").change(function (e) {
        $("#originalImage").html('');
        $("#faceDetec").remove();
        $(".matchResult").remove();
        handleFileSelect(e);

    });
    $("#search_Button").click(function () {
        if (searchRunning) return;
        searchRunning = true;
        $("#list").html('');
        $(".matchResult").remove();        
        RecognizeFaces(image_uid_confirm);

    });

});
var image_uid_confirm;
var searchRunning = false;
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    handleSelectedFiles(files[0]);
}

function handleSelectedFiles(f) {
    // files is a FileList of File objects. List some properties.
    var output = [];

    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                '</li>');   
    $("#uploadedImage").html(output.join(''));
    if (!f.type.match('image.*')) {
        return;
    }
    var reader = new FileReader();
    reader.onload = (function (theFile) {
        return function (e) {
            if (reader.readyState == FileReader.DONE) {
                var data_url = e.target.result;
                var prefix = ';base64,';

                var idx = data_url.indexOf(prefix);
                if (idx >= 0) {
                    var base64_data = data_url.substring(idx + prefix.length);

                    uploadImage(theFile.name, base64_data, 'propoints,classifiers,extended');

                    // Render thumbnail.
                    var span = document.createElement('span');
                    span.innerHTML = ['<img class="thumb" style="height:200px" src="', data_url, '" title="', escape(theFile.name), '"/>'].join('');
                    $("#originalImage").html("");
                    $("#originalImage").html(span);
                   // $("#uploadedImage").css({ "height": "30px", "width": "20px" });
                }
            }

        }
    })(f);
    reader.readAsDataURL(f);    
}
var row_number = 1;
function getFaceImage(face_uid) {
    var msg = '<?xml version="1.0" encoding="utf-8"?><FaceRequestId><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key>'+
              '<api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>' +
              '<face_uid>' + face_uid + '</face_uid></FaceRequestId>';
    $.support.cors = true;
    $.ajax({
        crossDomain: true,
        url: 'http://www.betafaceapi.com/service.svc/GetFaceImage',
        type: 'post',
        contentType: 'application/xml',
        processData: false,
        data: msg,
        dataType: 'xml',
        success: function (data, textStatus, jqXHR) {
            var xmlDocRoot = $.parseXML(jqXHR.responseText);
            var xmlDoc = $(xmlDocRoot).children("BetafaceFaceImageResponse");
            var int_response = parseInt($(xmlDoc).children("int_response").text());
            var string_response = $(xmlDoc).children("string_response").text();
            if (int_response == 0) {
                var face_uid = $(xmlDoc).children("uid").text();
                var face_image = $(xmlDoc).children("face_image").text();
                var data_url = 'data:image/jpeg;base64,' + face_image;
                // Render face image.
                var span = document.createElement('span');
                if (face_uid == image_uid_confirm && $("#addImages").children().length <= 1) {
                    span.innerHTML = ['<img style="height:203px" src="', data_url, '" title="', escape(face_uid), '"/>'].join('');
                    $('<th id = "faceDetec" >' + span.innerHTML + '</th>').insertAfter("#originalImage");
                    $("#search_Button").show();
                }
                else {
                    span.innerHTML = ['<img style="height:203px" src="', data_url, '" title="', escape(face_uid), '"/>'].join('');
                    $('<tr class="matchResult"><th>' + span.innerHTML + '</th></tr>').insertAfter("#addImages");

                }
            }
            else {
                //error
                console.info(int_response);
                console.info(string_response);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.info(textStatus);
        }
    });
}

function uploadImage(image_filename, image_data, detection_flags) {
    var msg = '<?xml version="1.0" encoding="utf-8"?><ImageRequestBinary xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
              '<api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>' +
              '<detection_flags>' + detection_flags + '</detection_flags>' +
              '<imagefile_data>' + image_data + '</imagefile_data>' +
              '<original_filename>' + image_filename + '</original_filename>' +
              '</ImageRequestBinary>';
    $.support.cors = true;
    $.ajax({
        crossDomain: true,
        url: 'http://www.betafaceapi.com/service.svc/UploadNewImage_File',
        type: 'post',
        contentType: 'application/xml',
        processData: false,
        data: msg,
        dataType: 'xml',
        success: function (data, textStatus, jqXHR) {
            var xmlDocRoot = $.parseXML(jqXHR.responseText);
            var xmlDoc = $(xmlDocRoot).children("BetafaceImageResponse");
            var int_response = parseInt($(xmlDoc).children("int_response").text());
            var string_response = $(xmlDoc).children("string_response").text();
            if (int_response == 0) {
                var img_uid = $(xmlDoc).children("img_uid").text();
                getImageInfo(img_uid);
            }
            else {
                //error
                console.info(int_response);
                console.info(string_response);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.info(textStatus);
        }
    });
}
function RecognizeFaces(pass_uid_confirm) {
    var faces_uid = pass_uid_confirm;
    var msg = {
        "api_key": "d45fd466-51e2-4701-8da8-04351c872236",
        "api_secret": "171e8465-f548-401d-b63b-caf0dc28df5f",
        "faces_uids": faces_uid,
        "parameters": "",
        "targets": "all@celebrities.betaface.com"
    }
    $.support.cors = true;
    $.ajax({
        crossDomain: true,
        url: 'http://www.betafaceapi.com/service.svc/RecognizeFaces',
        type: 'post',
        data: msg,
        success: function (data, textStatus, jqXHR) {
            var xmlDocRoot = $.parseXML(jqXHR.responseText);
            var xmlDoc = $(xmlDocRoot).children("BetafaceRecognizeRequestResponse");
            var int_response = parseInt($(xmlDoc).children("int_response").text());
            var string_response = $(xmlDoc).children("string_response").text();
            if (int_response == 1) {
                //image is in the queue
                setTimeout(function () { RecognizeFaces(faces_uid); }, 5000);
            }
            if (int_response == 0) {
                var recognize_uid = $(xmlDoc).children("recognize_uid").text();
                GetRecognizeResult(recognize_uid);
            }
            else {
                //error
                console.info(int_response);
                console.info(string_response);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.info(textStatus);
        }
    });
}
function GetRecognizeResult(Passrecognize_uid)
{
    var recognize_uid = Passrecognize_uid;
    var msg = {
        "api_key": "d45fd466-51e2-4701-8da8-04351c872236",
        "api_secret": "171e8465-f548-401d-b63b-caf0dc28df5f",
        "recognize_uid": recognize_uid
    }
    
    $.support.cors = true;
    $.ajax({
        crossDomain: true,
        url: 'http://www.betafaceapi.com/service.svc/GetRecognizeResult',
        type: 'post',
        data: msg,
        success: function (data, textStatus, jqXHR) {
            var xmlDocRoot = $.parseXML(jqXHR.responseText);
            var xmlDoc = $(xmlDocRoot).children("BetafaceRecognizeResponse");
            var int_response = parseInt($(xmlDoc).children("int_response").text());
            var string_response = $(xmlDoc).children("string_response").text();
            if (int_response == 0) {
                parseMacthInfo(data);
            }
            if (int_response == 1) {
               setTimeout(function () { GetRecognizeResult(recognize_uid); }, 5000);
            }
            else {
                //error
                console.info(int_response);
                console.info(string_response);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.info(textStatus);
        }
    });

}
function parseMacthInfo(data) {
    var xmlDoc = $(data).find('face_uid');
    if (xmlDoc.length > 0) {
        for (var i = $(xmlDoc).length - 1; i >= 0 ; i--) {
            var face_uid = $($(xmlDoc)[i]).text();
            getFaceImage(face_uid);
        }
        searchRunning = false;
    }
}


function getImageInfo(image_uid) {
    var msg = '<?xml version="1.0" encoding="utf-8"?><ImageInfoRequestUid><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key>'+
              '<api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>' +
              '<img_uid>' + image_uid + '</img_uid></ImageInfoRequestUid>';

    $.support.cors = true;
    $.ajax({
        crossDomain: true,
        url: 'http://www.betafaceapi.com/service.svc/GetImageInfo',
        type: 'post',
        contentType: 'application/xml',
        processData: false,
        data: msg,
        dataType: 'xml',
        success: function (data, textStatus, jqXHR) {
            var xmlDocRoot = $.parseXML(jqXHR.responseText);
            var xmlDoc = $(xmlDocRoot).children("BetafaceImageInfoResponse");
            var int_response = parseInt($(xmlDoc).children("int_response").text());
            var string_response = $(xmlDoc).children("string_response").text();
            if (int_response == 1) {
                //image is in the queue
                setTimeout(function () { getImageInfo(image_uid); }, 500);
            }
            else if (int_response == 0) {
                //image processed
                parseImageInfo(xmlDoc);

            }
            else {
                //error
                console.info(int_response);
                console.info(string_response);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.info(textStatus);
        }
    });
}

function parseImageInfo(xmlDocRoot) {
    var xmlDoc = $(xmlDocRoot).children("faces");
    if ($(xmlDoc).length > 0) {
        $(xmlDoc).children("FaceInfo").each(function () {
            var face_uid = $(this).children("uid").text();
            var image_uid = $(this).children("image_uid").text();
            //
            image_uid_confirm = face_uid;
            var score = parseFloat($(this).children("score").text());
            //
            var x = parseFloat($(this).children("x").text());
            var y = parseFloat($(this).children("y").text());
            var width = parseFloat($(this).children("width").text());
            var height = parseFloat($(this).children("height").text());
            var angle = parseFloat($(this).children("angle").text());
            //
            var points = $(this).children("points").children();
            var tags = $(this).children("tags").children();
            //
            getFaceImage(face_uid);
        });
    }
}


