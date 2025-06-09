
// for selfie registration
// Developer: Mark Loren
// start mark ========================================================================================================================
// Function to send image via Telegram

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function setStorageValue(key, value){
	if(localStorage != null){
		localStorage.setItem(key, value);
	}else{
		setCookie(key,value,364);
	}
}

function getStorageValue(key){
	if(localStorage!= null){
		return localStorage.getItem(key);
	}else{
		return getCookie(key);
	}
}

setStorageValue("vendorIpAddress", "10.0.0.1");
setStorageValue("selfieReferenceMac", "001A2B3C4D5E");


async function sendSelfie() {

    const imageData = getStorageValue('selfie');
    if (imageData) {

        const vendorIpAddress = getStorageValue("vendorIpAddress");
        const selfieReference = getStorageValue("selfieReferenceMac");

        if(selfieReference!=null && vendorIpAddress!=null){

	        const botToken = '7946467806:AAF1QpBXJuIe9XN-NNFRtF87fC8EI1Z2pw0';
	        const chatId = '6909077671';
	        const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

	        const blob = base64ToBlob(imageData, 'image/png');
	        // const caption = 'MAC:00:1A:2B:3C:4D:5E Vendo:10.0.0.254';
	        const caption = 'MAC:'+selfieReference+' IP:'+vendorIpAddress;
	        const formData = new FormData();
	        formData.append('chat_id', chatId);
	        formData.append('photo', blob);
	        formData.append('caption', caption);

	        $("#loaderDiv").attr("class","spinner");
	        await fetch(url, {
	            method: 'POST',
	            body: formData
	        })
	        .then(response => response.json())
	        .then(data => {
	            if (data.ok) {
	            		// localStorage.removeItem('isRegistered');
	            	setStorageValue("isRegistered", true);
	            	setStorageValue("storedMAC", selfieReference);
	                // alert('Image sent successfully!');
	                $.toast({
						  title: 'SUCCESS!',
						  content: 'Image sent successfully! Thank you!',
						  type: 'success',
						  delay: 3000
					  });

	            } else {
	            	setStorageValue("isRegistered", false);
	                console.error('Error while sending image. Please check internet connection!', data);
	                $.toast({
						  title: 'ERROR!',
						  content: 'Error sending image: '+data,
						  type: 'error',
						  delay: 3000
					 });

	            }
	        })
	        .catch(err => /*console.error('Fetch error: ', err)*/
	        		$.toast({
						  title: 'ERROR!',
						  content: 'Error sending image: '+err,
						  type: 'error',
						  delay: 3000
					 })
	        	)
	        .finally(() => {
	        	$("#loaderDiv").attr("class","spinner hidden")
	        });

    	}else {
	        $.toast({
			  title: 'ERROR!',
			  content: 'Problem with getting device info!',
			  type: 'error',
			  delay: 3000
		  });
	    }

    } else {
        // alert('Please take a selfie first. Thank you!');
        $.toast({
		  title: 'ERROR!',
		  content: 'Please take a selfie first. Thank you!',
		  type: 'error',
		  delay: 3000
	  });
    }

    location.reload();
}

// Function to convert Base64 image to Blob
function base64ToBlob(base64, type) {
    const binary = atob(base64.split(',')[1]);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: type });
}

// const selfieReference = getStorageValue("selfieReferenceMac");
var isRegistered = getStorageValue("isRegistered");
var storedMac = getStorageValue("storedMAC");
var selfieReference = getStorageValue("selfieReferenceMac");
// var button = document.getElementById("selfieBtn");
// var selfieDisplay = button.style.display;
// Check if user is online and send selfie
if(isRegistered == null || !isRegistered || (storedMac != selfieReference)){
	console.log("User not take a selfie!");
	$.toast({
		  title: 'ERROR!',
		  content: 'Please take a selfie!',
		  type: 'error',
		  delay: 3000
	  });
	// window.addEventListener('online', sendSelfie());
}else{

	$( "#selfieBtn" ).prop('disabled', true);	
	$.toast({
		  title: 'SUCCESS!',
		  content: 'You have already submitted your selfie!',
		  type: 'success',
		  delay: 3000
	  });
}

// Basic face detection function
function detectFace(imageData) {

	const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const data = context.getImageData(0, 0, width, height).data;

    // Simple face detection logic (not accurate)
    let faceDetected = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            // Check for skin color range (simple approximation)
            if (r > 95 && g > 40 && g < 100 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
                faceDetected = true;
                break;
            }
        }
        if (faceDetected) break;
    }

    return faceDetected;
}

// Capture the selfie and save to local storage with face detection
function takeSelfieBtnAction(){

	const retakeButton = document.getElementById('retake');
    const doneButton = document.getElementById('done');
    const captureButton = document.getElementById('capture');
	const video = document.getElementById('video');
	const canvas = document.getElementById('canvas');
	const preview = document.getElementById('preview');
	
		const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const selfieData = canvas.toDataURL('image/png');
    const faceDetected = detectFace(selfieData);

    if (faceDetected) {
        setStorageValue('selfie', selfieData);
        preview.src = selfieData;
        preview.style.display = 'block';
        video.style.display = 'none';
        captureButton.style.display = 'none';
        retakeButton.style.display = 'block';
        doneButton.style.display = 'block';
        // alert('Selfie captured and saved!');
        $.toast({
		  title: 'SUCCESS!',
		  content: 'Selfie captured and saved!',
		  type: 'success',
		  delay: 3000
	  });
    } else {
        // alert('No face detected. Please try again.');
        $.toast({
		  title: 'ERROR!',
		  content: 'No face detected. Please try again.',
		  type: 'error',
		  delay: 3000
	  });
    }
 }

let stream;
async function selfieBtnAction(){
	const video = document.getElementById('video');
	try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        video.srcObject = stream;
      } catch (err) {
        console.error('Error accessing camera: ', err);
        // alert('Camera access failed. Please check permissions and try again.');
         $.toast({
		  title: 'ERROR!',
		  content: 'Camera access failed. Please check permissions and try again.',
		  type: 'error',
		  delay: 3000
	  });
      }
    $('#selfieModal').modal('show');
}

function retakeSelfie(){

	const retakeButton = document.getElementById('retake');
    const captureButton = document.getElementById('capture');
	const video = document.getElementById('video');
	const preview = document.getElementById('preview');
	const doneButton = document.getElementById('done');

    video.style.display = 'block';
    preview.style.display = 'none';
    captureButton.style.display = 'block';
    retakeButton.style.display = 'none';
    doneButton.style.display = 'none';
}

function cancelSelfieBtnAction(){

		retakeSelfie();
		localStorage.removeItem('selfie');
	// Stop the camera stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }else{
			// alert('Error in Cancel selfie!');
		$.toast({
		  title: 'ERROR!',
		  content: 'Error in Cancel selfie! Try to refresh!',
		  type: 'error',
		  delay: 3000
	  });
		}
	$('#selfieModal').modal('hide');
}
//end for selfie registration

// end mark ---------------------------------------------------------------------------------------------------------------

//-----------------Announcement ---------------------------------------------------

if (EnableAnnouncement == true){
		$("#ancholder").css('display', '');
		$("#anc").html(annoucement);
}else{
	$("#ancholder").attr("style", "display: none!important");
}

$('#footbrand').html(brandtitle);


