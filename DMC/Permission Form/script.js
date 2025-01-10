function calculatePayment() {
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    const ratePerDay = parseFloat(document.getElementById("ratePerDay").value);

    if (endDate >= startDate) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const totalPayment = diffDays * ratePerDay;

        document.getElementById("output").innerHTML = `
            Total Days: ${diffDays} <br>
            Total Payment: ₹${totalPayment.toFixed(2)}
        `;
    } else {
        document.getElementById("output").innerHTML = "End date must be after or equal to the start date.";
    }
}

document.getElementById("bannerForm").addEventListener("submit", async function (event) {
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

    try {
        const response = await fetch("http://localhost:3000/submit-form", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok) {
            alert("Form submitted successfully!");

            // Show payment section
            document.getElementById("totalPayment").innerText = result.totalPayment;
            document.getElementById("paymentSection").style.display = "block";

            // Store form submission ID for payment
            document.getElementById("payNow").dataset.id = result.id;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("An error occurred while submitting the form.");
    }
});

document.getElementById("payNow").addEventListener("click", async function () {
    const submissionId = this.dataset.id;

    try {
        const response = await fetch("http://localhost:3000/make-payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: submissionId }),
        });

        const result = await response.json();

        if (response.ok) {
            // Redirect user to payment URL
            window.location.href = result.paymentUrl;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error initiating payment:", error);
        alert("An error occurred while initiating the payment.");
    }
});