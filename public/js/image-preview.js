// Image preview before upload
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.querySelector('#image-input');
    const previewContainer = document.querySelector('#image-preview');
    
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    previewContainer.innerHTML = `
                        <img src="${event.target.result}" alt="Preview">
                        <button type="button" onclick="removeImage()">Remove</button>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function removeImage() {
    document.querySelector('#image-input').value = '';
    document.querySelector('#image-preview').innerHTML = '';
}