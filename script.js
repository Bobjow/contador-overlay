document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = ["AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE"];
    let currentKeyIndex = 0;
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');

    // 👇 Função de rotação corrigida
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
        console.log("Mensagem ativa:", currentMessage + 1);
    };

    const updateLikes = async () => {
        try {
            const liveResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKeys[currentKeyIndex]}`);
            const liveData = await liveResponse.json();
            
            if (liveData.items?.length > 0) {
                const videoId = "b2b2KH9V3Bc"; // 👈 ID FIXO DA SUA LIVE
                const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKeys[currentKeyIndex]}`);
                const statsData = await statsResponse.json();
                
                const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;
                
                // Atualização em tempo real
                document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
                document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

                if (likes >= meta) {
                    meta += 100;
                    gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                        style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            }
        } catch(error) {
            console.log("Erro detectado:", error);
        }
    };

    // Intervalos ajustados
    setInterval(updateLikes, 30000); // 30 segundos
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});