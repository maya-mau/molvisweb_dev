
textArray = [];
var current  = 0;


const nextButton = document.getElementById('next');
const backButton = document.getElementById('back');
backButton.style.visibility = 'hidden';
const div = document.getElementById('start');

//const div = document.getElementsByClassName('column right')[0];

nextButton.addEventListener('click', nextDiv);
backButton.addEventListener('click', backDiv); 

var zero = `<h1>Activity 2</h1> 
<p>In the prior activity, you read about Sandra, who has chronic myeloid leukemia (CML).  You learned about a drug, imatinib, that can be used to treat CML by binding to a protein target.  There are many drugs that can be used to treat CML and that can bind to this same protein. The specific way that drug molecules bind to the protein depends on the intermolecular forces (noncovalent interactions) between the molecules.  Today, you are going to explore the structure of another drug used to treat CML, called ponatinib. The structure of the drug molecule determines how it will interact with the protein target.</p>
<p>5. Currently, the molecule displayed is Caffeine. Locate the control panel on the left side of the screen. For the drop-down menu titled “molecule”, switch Caffeine to Ponatinib. Next, click your mouse anywhere on the molecule and hold. Drag your mouse to move the molecule around the screen. In a few words, describe what you see on your screen. </p> 
<p>6. What one type of atom makes up most of the molecule? </p>
<p>7. Do you think the atoms in the molecule are connected with covalent bonds, ionic bonds or intermolecular forces? Explain your answer. </p>
<p>8. Identify one more structural feature of the molecule that interests you. </p>

<p><b> Viewing the Molecule </b></p>
<p><i> Tip: You can reset the view by pressing the “=” key or by pressing the “reset position” button at the bottom left of the page. </i></p>
<p>2a. How many ring-like structures can you find on the molecule?</p>
<p>2b. Where do you notice that the white colored hydrogen atoms are located on the molecule?</p>
<p>2c. How many red oxygen atoms do you see?</p>
<p>2d. Determine the number of green colored fluorine atoms on the molecule. </p>
<p>6. List two similarities and differences between the 2-D molecular structure of ponatinib shown above and the 3D molecular structure that you can manipulate on your screen.</p>
<p></p>
<p></p>
<p></p>

`;
textArray.push(zero);

var one = "<h1>Activity 3</h1> <p>Insert content here.</p>";
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


