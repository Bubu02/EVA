const form = document.getElementById('evaluationForm');
const previousBtn = document.getElementById('previousBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadBtn');
const remarkInput = document.getElementById('remarkInput');
const imageInput = document.getElementById('imageInput');
const remarksList = document.getElementById('remarks');
const displayEmail = document.getElementById('displayEmail');
const displayTaskNumber = document.getElementById('displayTaskNumber');

// Initialize task index and tasks data
let currentTaskIndex = 0;
let tasks = [];
let savedEmail = "";

// Function to add a new task
function addTask(taskNumber) {
    tasks.push({ taskNumber, remarks: [] });
}

// Add tasks dynamically (e.g., from user input or a database)
const numTasks = prompt("Enter the number of tasks:");
savedEmail = prompt("Enter the email:");
displayEmail.textContent = savedEmail; // Set the email display value
for (let i = 1; i <= numTasks; i++) {
    addTask(`Task-${i}`);
}

// Function to update form fields based on task index
function updateFormFields() {
    displayTaskNumber.textContent = tasks[currentTaskIndex].taskNumber;
    remarksList.innerHTML = '';
    tasks[currentTaskIndex].remarks.forEach((remark, index) => {
        const remarkLi = document.createElement('li');
        const remarkDiv = document.createElement('div');
        const remarkText = document.createElement('span');
        remarkText.innerHTML = remark.text.replace(/\*(.*?)\*/g, '<span style="color:red">$1</span>');
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            const remarkTextarea = document.createElement('textarea');
            remarkTextarea.value = remark.text;
            remarkTextarea.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    tasks[currentTaskIndex].remarks[index].text = event.target.value;
                    updateFormFields();
                    event.preventDefault(); // prevent default Enter key behavior
                }
            });
            remarkDiv.replaceChild(remarkTextarea, remarkText);
        });
        remarkDiv.appendChild(remarkText);
        remarkDiv.appendChild(editButton);

        if (remark.image) {
            const img = document.createElement('img');
            img.src = remark.image;
            img.style.maxWidth = '300px';
            img.style.display = 'block';
            img.style.margin = '10px 0';
            const changeImageButton = document.createElement('button');
            changeImageButton.textContent = 'Change Image';
            changeImageButton.addEventListener('click', () => {
                const newImageInput = document.createElement('input');
                newImageInput.type = 'file';
                newImageInput.accept = 'image/*';
                newImageInput.addEventListener('change', (event) => {
                    const newImage = event.target.files[0];
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        tasks[currentTaskIndex].remarks[index].image = e.target.result;
                        updateFormFields();
                    };
                    reader.readAsDataURL(newImage);
                });
                newImageInput.click();
            });
            remarkDiv.appendChild(img);
            remarkDiv.appendChild(changeImageButton);
        }

        remarkLi.appendChild(remarkDiv);
        remarksList.appendChild(remarkLi);
    });
}

// Event listener for adding remarks
remarkInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const remark = remarkInput.value.trim();
        const image = imageInput.files[0];

        if (remark) {
            const reader = new FileReader();
            reader.onload = function(e) {
                tasks[currentTaskIndex].remarks.push({
                    text: remark,
                    image: e.target.result
                });
                remarkInput.value = '';
                imageInput.value = '';
                updateFormFields();
            };
            if (image) {
                reader.readAsDataURL(image);
            } else {
                tasks[currentTaskIndex].remarks.push({
                    text: remark,
                    image: null
                });
                remarkInput.value = '';
                updateFormFields();
            }
        }
        event.preventDefault(); // prevent default Enter key behavior
    }
});

// Event listeners for navigation buttons
previousBtn.addEventListener('click', () => {
    if (currentTaskIndex > 0) {
        currentTaskIndex--;
        updateFormFields();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentTaskIndex < tasks.length - 1) {
        currentTaskIndex++;
        updateFormFields();
    }
});

// Function to draw text with red-colored parts
function drawColoredText(doc, text, x, y) {
    const parts = text.split(/\*(.*?)\*/g);
    let currentX = x;
    let currentY = y;

    parts.forEach((part, index) => {
        const textWidth = doc.getTextWidth(part);
        if (currentX + textWidth > 180) { // Adjust 180 to your PDF page width
            currentX = x;
            currentY += 10;
        }

        if (index % 2 === 1) {
            doc.setTextColor(255, 0, 0);
        } else {
            doc.setTextColor(0, 0, 0);
        }

        doc.text(part, currentX, currentY);
        currentX += textWidth;
    });

    doc.setTextColor(0, 0, 0); // Reset color
}

// Event listener for form submission
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = savedEmail; // Use the saved email
    const evaluations = tasks.map((task) => ({ taskNumber: task.taskNumber, remarks: task.remarks }));

    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text(`Email: ${email}`, 10, 10);

    evaluations.forEach((evaluation, index) => {
        if (index > 0) {
            doc.addPage();
        }
        doc.text(`Task Number: ${evaluation.taskNumber}`, 10, 20);
        let yPosition = 30; // Initial y position
        evaluation.remarks.forEach((remark, remarkIndex) => {
            if (remark.image) {
                const imgHeight = 90; // Height of the image
                const remainingHeight = 280 - yPosition; // Calculate remaining height on page

                if (remainingHeight < imgHeight + 20) { // Move to next page if not enough space
                    doc.addPage();
                    yPosition = 20;
                }

                drawColoredText(doc, `• ${remark.text}`, 10, yPosition);
                yPosition += 10;

                const imgWidth = 180; // Decreased image size for PDF
                doc.addImage(remark.image, 'JPEG', 10, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10; // Adjust spacing for image
            } else {
                drawColoredText(doc, `• ${remark.text}`, 10, yPosition);
                yPosition += 10;

                if (yPosition > 290) { // Adjust 290 to the height of your PDF page
                    doc.addPage();
                    yPosition = 20; // Reset y position for new page
                }
            }
        });
    });

    // Display the download button
    downloadBtn.style.display = 'block';
    downloadBtn.addEventListener('click', () => {
        doc.save('evaluation.pdf');
    });

    // Show the form again
    form.style.display = 'block';
    // Hide the navigation buttons again
    previousBtn.style.display = 'inline-block';
    nextBtn.style.display = 'inline-block';
    submitBtn.style.display = 'inline-block';
    remarkInput.style.display = 'block';
    imageInput.style.display = 'block';

    // Update the form fields with the saved email and task details
    updateFormFields();
});

updateFormFields(); // Initialize form fields on load
