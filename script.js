document.addEventListener('DOMContentLoaded', () => {
    // 👇 Ordenei as chaves por prioridade (V2 > V3 > V1)
    const apiKeys = [
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE", // V2 (prioridade máxima)
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ", // V3
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4"  // V1 (último recurso)
    ];
    
    let currentKeyIndex = 0; // Começa pela V2
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let isLive = false;

    // 👇 Função modificada para evitar ciclos desnecessários
    const cycleApiKey = () => {
        if(currentKeyIndex < apiKeys.length - 1) {
            currentKeyIndex++;
            console.log(`Alternando para chave V${currentKeyIndex + 1}`);
        }
    };

    const fetchOptions = {
        referrerPolicy: "strict-origin-when-cross-origin"
    };

    const updateLikes = async () => {
        try {
            const liveResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKeys[currentKeyIndex]}`, fetchOptions);
            
            // 👇 Verificação explícita de erro 403
            if(liveResponse.status === 403) {
                cycleApiKey();
                return;
            }

            const liveData = await liveResponse.json();
            
            if (liveData.items?.length > 0) {
                const videoId = liveData.items[0].id.videoId;
                const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKeys[currentKeyIndex]}`, fetchOptions);
                
                if(statsResponse.status === 403) {
                    cycleApiKey();
                    return;
                }

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
            console.log("Erro geral:", error.message);
            cycleApiKey();
        }
    };

    // Resto do código mantido igual
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    setInterval(updateLikes, 300000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});