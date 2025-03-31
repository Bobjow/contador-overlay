document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = ["AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE"];
    const VIDEO_ID = "b2b2KH9V3Bc"; // ID fixo da sua live atual
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');

    // Rotação de mensagens (já funciona)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 👇 Nova estratégia: Busca direta pelos likes
    const updateLikes = async () => {
        try {
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[0]}&nocache=${Date.now()}`);
            
            if (!statsResponse.ok) {
                console.error("Erro na API:", statsResponse.status);
                return;
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;

            // Atualização visual forçada
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if (likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

            console.log("Likes atualizados:", likes); // 👈 Log crítico
            
        } catch(error) {
            console.error("Erro geral:", error);
        }
    };

    // Intervalos ajustados
    setInterval(updateLikes, 10000); // 10 segundos
    setInterval(rotateMessages, 5000);
    updateLikes(); // Primeira execução
    messages[0].classList.add('active');
});