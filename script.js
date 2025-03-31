document.addEventListener('DOMContentLoaded', () => {
    const apiKey = "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4";
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentVideoId = null;
    let isLive = false;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let updateInterval = null; // 👈 Controle do intervalo

    const updateLikes = async () => {
        try {
            // Primeira verificação: está em live?
            const liveCheck = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`);
            const liveData = await liveCheck.json();
            
            if (!liveData.items?.length) {
                if (isLive) {
                    console.log("Live encerrada - parando monitoramento");
                    clearInterval(updateInterval); // 👈 Para todas as verificações
                    isLive = false;
                }
                return; // 👈 Sai sem fazer mais nada
            }

            // 👇 Apenas executa se estiver em live
            isLive = true;
            const videoId = liveData.items[0].id.videoId;

            if (videoId !== currentVideoId) {
                currentVideoId = videoId;
                meta = 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;
            
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if (likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            console.log("Erro na API");
        }
    };

    const startMonitoring = () => {
        // Verificação inicial
        updateLikes();
        // Inicia intervalo APENAS se estiver em live
        if (isLive) {
            updateInterval = setInterval(updateLikes, 60000); // 👈 1 minuto
        }
    };

    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // Sistema de detecção inicial
    const initialCheck = async () => {
        const liveCheck = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`);
        const liveData = await liveCheck.json();
        
        if (liveData.items?.length) {
            startMonitoring();
        }
    };

    // Inicia verificações
    initialCheck(); // 👈 Só roda 1 vez no carregamento
    setInterval(rotateMessages, 5000);
});