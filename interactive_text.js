
textArray = [];
var current  = 0;


const nextButton = document.getElementById('next');
const backButton = document.getElementById('back');
backButton.style.visibility = 'hidden';
const div = document.getElementById('start');

//const div = document.getElementsByClassName('column right')[0];

nextButton.addEventListener('click', nextDiv);
backButton.addEventListener('click', backDiv); 

var zero = "<h1>Welcome!</h1> <p> This is an in-progress website to bring VMD-like molecule interaction and exploration to a broader audience by making it in an html website. Try moving around the molecule, switching what is represented, and selecting atoms. This part of the page will eventually function to guide students through a set of activites related to the molecules. </p>";
textArray.push(zero); 

var one = "<p>In the prior activity, you read about Sandra, who has chronic myeloid leukemia (CML).  You learned about a drug, imatinib, that can be used to treat CML by binding to a protein target.  There are many drugs that can be used to treat CML and that can bind to this same protein. The specific way that drug molecules bind to the protein depends on the intermolecular forces (noncovalent interactions) between the molecules.  Today, you are going to explore the structure of another drug used to treat CML, called ponatinib. The structure of the drug molecule determines how it will interact with the protein target.</p>";
textArray.push(one); 

var two = "<p>this is the second page of content. what a treat!</p>";
textArray.push(two); 

var three = "<p>this is the third page of content. yippee!</p>";
textArray.push(three); 

div.innerHTML = textArray[current]
function nextDiv() {
    if (!(current == textArray.length-1)){ 
        backButton.style.visibility = 'visible';
        current += 1; 
        div.innerHTML = textArray[current]; 
    }

    if (current == textArray.length-1){ 
        nextButton.style.visibility = 'hidden';
    }
    console.log(current)
}

function backDiv() {
    if (current >0){ 
        nextButton.style.visibility = 'visible';
        current -= 1; 
        div.innerHTML = textArray[current]; 
    }
    if(current == 0){
        backButton.style.visibility = 'hidden';
    }
}


