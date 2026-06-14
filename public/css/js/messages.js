// Message polling for real-time updates
let lastMessageId = 0;

function pollMessages() {
    fetch(`/api/messages/new?since=${lastMessageId}`)
        .then(res => res.json())
        .then(messages => {
            if (messages.length > 0) {
                updateMessageUI(messages);
                lastMessageId = messages[messages.length - 1].id;
            }
        });
}

setInterval(pollMessages, 5000);