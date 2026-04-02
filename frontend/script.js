async function askText() {
    let question = document.getElementById("textInput").value;
    let formData = new FormData();
    formData.append("question", question);

    let res = await fetch("http://127.0.0.1:8000/ask_text/", {
        method: "POST",
        body: formData
    });
    let data = await res.json();
    document.getElementById("answerText").innerText = data.text;
    document.getElementById("answerAudio").src = data.audio;
}

async function askVoice() {
    let file = document.getElementById("voiceInput").files[0];
    let formData = new FormData();
    formData.append("file", file);

    let res = await fetch("http://127.0.0.1:8000/ask_voice/", {
        method: "POST",
        body: formData
    });
    let data = await res.json();
    document.getElementById("answerText").innerText = data.text;
    document.getElementById("answerAudio").src = data.audio;
}