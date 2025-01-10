    document.getElementById("bannerForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission behavior

    const formData = {
        applicantName: document.getElementById("applicantName").value,
        contactNumber: document.getElementById("contactNumber").value,
        bannerLocation: document.getElementById("bannerLocation").value,
        bannerSize: document.getElementById("bannerSize").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        ratePerDay: document.getElementById("ratePerDay").value,
    };

    fetch("http://localhost:3000/submit-form", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
        .then(response => {
            if (!response.ok) throw new Error("Failed to submit form");
            return response.json();
        })
        .then(data => {
            alert("Form submitted successfully!");
            console.log("Server Response:", data);
        })
        .catch(error => {
            console.error("Error submitting form:", error);
            alert("An error occurred while submitting the form.");
        });

});