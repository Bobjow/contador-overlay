document.addEventListener('DOMContentLoaded', () => {
    const apiKey = "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4";
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');

    const updateLikes = async () => {
        try {
            const liveResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`);
            const liveData = await liveResponse.json();
            
            if (liveData.items?.length > 0) {
                const videoId = liveData.items[0].id.videoId;
                const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
                const statsData = await statsResponse.json();
                const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;
                
                document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
                document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

                if (likes >= meta) {
                    meta += 100;
                    gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            }
        } catch(error) {
            console.log("Atualizando...");
        }
    };

    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3; // 👈 Número fixo (3 mensagens)
    };

    setInterval(updateLikes, 300000);
    setInterval(rotateMessages, 5000);
    updateLikes();
});