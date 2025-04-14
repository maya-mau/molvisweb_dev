
textArray = [];
var current  = 0;


//const nextButton = document.getElementById('next');
//const backButton = document.getElementById('back');
//backButton.style.visibility = 'hidden';
const div = document.getElementById('start');

//const div = document.getElementsByClassName('column right')[0];

//nextButton.addEventListener('click', nextDiv);
//backButton.addEventListener('click', backDiv); 

var zero = `<h1>Abridged Activity</h1> 
<span>Adapted from </span><a href="https://pubs.acs.org/doi/full/10.1021/acs.jchemed.4c00036">Parthena E. Kotsalidis et. al.</a><span> (1)</span>
<p class="section-title"><b>Exploring the Drug Ponatinib</b></p>
<p>Chronic Myeloid Leukemia (CML) is a cancer of the myeloid cells, which are cells that make red blood cells, platelets and most types of white blood cells.(2) Patients with cancer produce more white blood cells than they need due to the overactive BCR-ABL gene. However, highly effective drugs have been developed to inhibit the function of this overactive kinase in patients with CML. One such drug is Imatinib, which binds to the Abl kinase and inhibits its function. Imatinib works by fitting into the binding pocket of the Abl kinase, the same binding pocket ATP would bind in. When imatinib binds, the Abl kinase can no longer bind the ATP molecule it needs to function. As a result, the overactive kinase gets turned off.</p>
<p>There are many drugs that can be used to treat CML and that can bind to this same protein. The specific way that drug molecules bind to the protein depends on the intermolecular forces (noncovalent interactions) between the molecules.  Today, you are going to explore the structure of another drug used to treat CML, called ponatinib. The structure of the drug molecule determines how it will interact with the protein target.</p>

<p class="section-title"><b>I. Loading the Drug Molecule into MolVisWeb</b></p>
<p>1. Open the molecular visualization software (you're already here!)</p>
<p>2. Three panels are currently visible: the control panel (left), the molecule display panel (middle), and the activities panel (right). Note that the default molecule displayed is Caffeine.</p>
<p>3. If you would like to, you can hide the activities panel on the right using the button in the upper right corner of the screen, since all of those questions are in this document.</p>
<p>4. Locate the control panel on the left side of the screen. For the drop-down menu titled “molecule”, switch Caffeine to Ponatinib.</p>
<p>5. The drug molecule should now be loaded.</p>
<p>6. Click your mouse anywhere on the molecule and hold. Drag your mouse to move the molecule around the screen. In a few words, describe what you see on your screen.</p>
<p>Each atom in the molecule has its own unique color. The colors of the atoms are summarized here: Carbon (grey), Hydrogen (white), Oxygen (red), Nitrogen (blue), Fluorine (green).</p>
<p>7. What one type of atom makes up most of the molecule?</p>
<p>8. Do you think the atoms in the molecule are connected with covalent bonds, ionic bonds or intermolecular forces? Explain your answer.</p>
<p>9. Identify one more structural feature of the molecule that interests you.</p>

<p class="section-title"><b>II. Viewing the Molecule</b></p>
<p><i>Tip: You can center the display around the molecule by pressing the “=” key.</i></p>
<p>1. First, let’s explore translating and rotating the molecule. As you discovered before, dragging the mouse around the screen rotates the molecule. What movement occurs when you use the up, left, right, and down arrow keys to move the molecule?</p>
<p>2. Now we are going to explore centering and rotating around a specific atom. Press the “c” key to turn on centering mode. Your mouse icon should turn into a pointing finger.</p>
<p>Pick one atom at one of the ends of the drug molecule and click on it with your mouse. Then press “c” again to exit centering mode and rotate the molecule by dragging with your mouse. Describe how your molecule moves.</p>
<p>3a. Take a moment to study the drug molecule once again. How many ring-like structures can you find on the molecule?</p>
<p>3b. Where do you notice that the white colored hydrogen atoms are located on the molecule?</p>
<p>3c. How many red oxygen atoms do you see?</p>
<p>3d. Determine the number of green colored fluorine atoms on the molecule.</p>
<p>4. List two similarities and differences between a 2-D molecular structure of ponatinib and the 3D molecular structure that you can manipulate on your screen.</p>

<p class="section-title"><b>II. Drawing Methods</b></p>
<p>1. In the control panel, notice the parameters that you are currently working with:</p>
<p><b>Drawing Method: Ball-and-stick</b></p>
<p><b>Coloring Method: Name</b></p>
<p>2. Next, let’s experiment with a few different Drawing Methods. Input the following selections in the Graphical Representations window, and describe what you see.</p>
<p><b>Drawing Method: Space filling</b></p>
<p><b>Coloring Method: Name</b></p>
<p>3. Next try the following settings for graphical representations. Describe what you see.</p>
<p><b>Drawing Method: Lines</b></p>
<p><b>Coloring Method: Name</b></p>
<p>4. Now that we’ve seen a variety of different drawing methods, let’s compare them! Match the following statements with the drawing method that you think would be most helpful  in answering the question. More than one drawing method can be used for a single question.</p>
<p>4a. Which drawing method, in your opinion, is most helpful in identifying specific atoms – Lines or Ball-and-stick – and why?</p>
<p>4b. There are many interesting structural features in the ponatinib molecule. One such feature is a triple bond that looks like a longer extended line. Which drawing method, in your opinion, is most helpful in identifying the linear region in the ponatinib molecule – Space filling or Line – and why?</p>
<p>4c. Which drawing method, in your opinion, best helps you determine the angles around the atoms – Lines or Space filling – and why?</p>
<p>4d. Which drawing method, in your opinion, best helps you determine the amount of space taken up   by the atoms in the molecule – Lines or Space filling – and why?</p>
<p>4e. Which drawing method, in your opinion, is most helpful in identifying the rings in the molecule – Lines or Space filling – and why?</p>
<p>4f. Do you think there is one “best” way to represent or draw molecules? Why or why not?</p>

<p class="section-title"><b>IV. Determining Distances Between Atoms</b></p>
<p>1. Input the following parameters into the Graphical Representations Window:</p>
<p><b>Drawing Method: Ball-and-stick</b></p>
<p><b>Coloring Method: Name</b></p>
<p>2. Press the “2” key. You will see a white cross appear on your screen in place of your mouse.</p>
<p>3. Click on a green fluorine atom. A label will appear next to the fluorine atom.</p>
<p>4. Fill in the blank for the label DRG285:F____. (DRG is an abbreviation for drug. There are three fluorine atoms, so each one has a different number 34-36.)</p>
<p>5. Now click on the red Oxygen atom. A label will appear next to the oxygen atom. </p>
<p>6. Fill in the blank for the label DRG285:O____.</p>
<p>7. You will see a white line between the two atoms with a green number. The number that pops up is the distance between the two atoms. VMD measures distance in Angstroms where 1 Angstrom = 10-10 meters. What is that distance?</p>
<p><i>Tip: You can hide labels and bonds by pressing “2” and clicking on the two atoms again.</i></p>
<p>8. Pick two other atoms to find the distance between and do so. Write the names of the atoms and their distance in the space below.</p>

<p class="section-title"><b>Exploring the Protein: Abl Kinase</b></p>
<p>Thus far, you have learned that imatinib and ponatinib are two drugs that can treat chronic myeloid leukemia. They both bind to a kinase protein called the Bcr-Abl kinase. In addition, you have explored basic ways to use VMD to manipulate and analyze the structure of the drug molecule ponatinib. Next, you will explore the structure of the Abl kinase portion of this protein. Proteins are large complex molecules that are made up of many smaller units called amino acids. An amino acid in a protein is often called a “residue”. Proteins play a critical role in your body. They are required for regulation of the body’s tissues and organs, and they are required for structure and function.</p>

<p class="section-title"><b>Loading the Protein: Abl Kinase into MolVisWeb</b></p>
<p>1. In the control panel, click select the Abl kinase molecule from the top drop-down menu. It might take a few seconds to load.</p>
<p>2. Now, the Abl kinase protein is shown in your display panel.</p>
<p>3. Use the skills you have learned thus far to explore the molecule.</p>

<p class="section-title"><b>II. Drawing Methods</b></p>
<p>As you observed in the earlier exploration with the drug, many valuable methods exist for representing molecules.</p>
<p>Notice the parameters that you are currently working with:</p>
<p><b>Drawing Method: Ball-and-stick</b></p>
<p><b>Coloring Method: Name</b></p>
<p>1. As mentioned above, there are three Drawing Methods in MolVisWeb: Space filling, Ball-and-stick, and Lines. Spend a few minutes exploring each method with the protein.</p>
<p>2. Experiment with a few of the different Drawing Methods and decide which methods you like the best for the protein. List your favorite Drawing Method in the space below.</p>

<p class="section-title"><b>III. Amino Acid Residue Selections</b></p>
<p>As mentioned previously, an amino acid (small units that make up proteins) within a protein can also be called a “residue”. There are 20 amino acid residues used to make proteins. The order these amino acids string together determines the primary sequence of the protein, which in turn can determine how the protein folds into a 3D structure. </p>
<p>The Abl kinase protein you are working with today has a unique 3D structure determined by the sequence of amino acid residues that make it up. It has a total of 284 amino acids. The Amino Acids Reference sheet linked below shows the structural formulas for the amino acids.</p>
<a href="https://drive.google.com/file/d/1wGbIfO0yy8VcTLlB88T1_IGiannQvyrJ/view">Amino Acids Reference Sheet</a>
<p>In the control panel enter the following:</p>
<p><b>Drawing Method: Ball-and-stick</b></p>
<p><b>Coloring Method: Name</b></p>
<p>In the “SELECTION METHOD” section, make sure you’re in the “Residue” tab. Replace the word “all” with “86”. Press enter to apply your changes.</p>
<p>You’ve just selected an amino acid residue.</p>
<p><i> Tip: You can reset the view by pressing the “=” key or by pressing the “reset position” button at the bottom left of the page. </i></p>
<p>1. Use your Amino Acids Reference sheet to write the name, three letter code, and single code for the amino acid you selected.</p>
<p>2. Explore the 3D amino acid on your screen. In what ways does the 2D structure of the amino acid on your reference sheet compare to the 3D structure of amino acid on your VMD screen? List two similar and two different properties in the table below.</p>

<p class="section-title"><b>IV. Protein Structure</b></p>
<p>Proteins like the Abl kinase contain amino acids. Amino acids have a unique structure. Each amino acid shares a set of atoms that make up the amino acid backbone. The central carbon atom, also called the alpha carbon, has an atom or a group of atoms attached to it that varies among the amino acids (These groups are called side chains). When strung together, these amino acids make up a protein.</p>
<p>Next, let’s look at the backbone of the Abl kinase protein.</p>
<p>1. In the “SELECTION METHOD” section, select the tab “Molecule”.</p>
<p>2. In the “molecule” box, type “backbone”. Press enter.</p>
<p>3. What types of atoms do you see in the backbone? List the types of atoms in the space below.</p>
<p>4. Based on what you see in the representation, why do you think it is called the “backbone” of Abl Kinase?</p>

<p class="section-title"><b>Exploring the Drug-Protein Complex</b></p>
<p>Next, we will explore a complex, or a system made from more than one molecule interacting (or binding)  with each other.  The complex you will be studying involves two molecules – the drug molecule ponatinib, which you studied in an earlier activity, and the protein molecule Abl kinase, which you also studied in an earlier activity and is the structurally important part of ponatinib’s target, the Bcr-Abl kinase.  By studying this complex, you will begin to understand how ponatinib interacts with this target to treat chronic myeloid leukemia.</p>
<p>1. Select “Ponatinib abl kinase” from the dropdown menu of molecules.</p>
<p></p>

<p class="section-title"><b>I. Visualizing Each Molecule Differently Through Creating Multiple Representations</b></p>
<p>There are two molecules in this complex, but they are currently very hard to see distinctly.  In a complex, each molecule is usually assigned a different name or letter.  In this particular complex, the protein is “abl kinase” and the drug is “ponatinib”.</p>
<p>You can use multiple representations to more easily visualize each molecule separately:</p>
<p>1. In the “SELECTION METHOD” box, click on the “Molecule” tab. Change the selection from “all” to “abl kinase”.  You may not notice a difference in what you see in the display, but the drug molecule will no longer be shown.</p>
<p>2. Select the following:</p>
<p><b>Drawing Method: Space filling</b></p>
<p><b>Coloring Method: Blue</b></p>
<p>3. In a few words describe what you see.</p>
<p>4. Now, click on the “add rep” button in the control panel.</p>
<p>5. You will now see a new tab added, named “Rep 1”.</p>
<p>6. In the “SELECTION METHOD” section of Rep 1, select the tab “Molecule”. Using the drop down menu, change the selection from “all” to “ponatinib”.</p>
<p>7. Change the “coloring method” of this representation to “Red”. In a sentence or two, describe what you see.</p>
<p>8. IMPORTANT: You can toggle between each tab (in this case, the drug ponatinib and target abl kinase) by clicking on the tabs at the top.</p>
<p>9. Try clicking on the “hide rep” button circled below. This allows you to temporarily remove representations from the screen while saving their selection settings.</p>
<p>10. Use your skills in MolVisWeb to represent the system as follows:</p>
<p>10a. First, make the drug (ponatinib) drawn with the “Lines” drawing method and colored by “Name”.</p>
<p>10b. Next, make the protein (abl kinase) have the “Lines” drawing method and colored “Blue”.  </p>
<p>11. Now try to represent your drug and protein in whatever different representations you choose for each.</p>
<p>12. In a sentence or two, explain why you think it might be useful to represent different molecules in different ways when looking at a complex.</p>

<p class="section-title"><b>II. Identifying Hydrogen Bonds Between Drug and Protein Target</b></p>
<p>As you can see and explore using VMD, the drug has a shape that enables it to fit within the ATP-binding pocket of this kinase.  But in addition to having a shape that is complementary, or just the right fit, the drug also makes hydrogen bonds with the protein. To see the hydrogen bonds, it helps to focus only on parts of the protein that are very close to the drug. We can use VMD to select only those amino acid residues on the protein that are very close to the drug in this complex:</p>
<p>1. First, change the representation of the drug (ponatinib) to use the Drawing Method “Space filling” and Coloring Method “Name” if those are currently not the selected representations.</p>
<p>2. Next, for Rep 1 in the “SELECTION METHOD” section, click on the tab “Distance”. You are now selecting by distance. Change the selection to say:</p>
<p><b>“show all residues within 4 of molecule ponatinib”</b></p>
<p>What does this do? This selection tells VMD to show only the residues (amino acids) of the protein that have at least one atom that is within a distance of 4 Angstroms (where one Angstrom is 10-10 m) from at least one atom on the drug.  In other words, it shows parts of the protein that are close to the drug in 3D space.  Because hydrogen bonds occur between molecules only when the molecules are very close to each other, this is a good way to remove irrelevant parts of the protein when trying to find hydrogen bonds.</p>
<p>3. Use the Drawing Method “Ball-and-stick” and the Coloring Method “Name” in Rep 1 so you can identify different types of atoms.</p>
<p>4. You may have learned about hydrogen bonds in a previous chemistry class, which are noncovalent (intermolecular) interactions that occur between an O, N, or F atom that has a partial negative charge and an H atom that is bonded to an O, N, or F atom and therefore has a partial positive charge.  Hydrogen bonds typically have a length of between 2-3 Angstroms – they are longer than a covalent bond, but can be strong enough to hold two different molecules together.</p>
<p class="section-title"><b>CHALLENGE</b></p>
<p>See if you can identify an atom on the drug (ponatinib) that is involved in a hydrogen bond with an atom on the target protein (abl kinase). These bonds are not shown by default.  So you instead will use your knowledge of chemistry to find them.  Once you believe you have found a hydrogen bond, find the length of the bond by pressing “2” and then clicking on the two atoms.</p>
<p>How many hydrogen bonds can you find between the drug and the target?  Hint: there are four total! You only need to find one. Record the length of the hydrogen bond in the box below.</p>
<p><i>Tip: You can hide labels and bonds by pressing “2” and clicking on the two atoms again.</i></p>

<p class="section-title"><b>Sources</b></p>
<p>(1) Kotsalidis, P. E.; Kranc, S. N.; Berryman, M.; Radhakrishnan, M. L.; Elmore, D. E. EMMAs: Implementation and Assessment of a Suite of Cross-Disciplinary, Case-Based High School Activities to Explore Three-Dimensional Molecular Structure, Noncovalent Interactions, and Molecular Dynamics. J. Chem. Educ. 2024, 101 (6), 2436–2447. https://doi.org/10.1021/acs.jchemed.4c00036.</p>
<p>(2)  “What Is Chronic Myeloid Leukemia?: Leukemia Types.” American Cancer Society, 19 June 2018, https://www.cancer.org/cancer/chronic-myeloid-leukemia/about/what-is-cml.html.</p>
`;
textArray.push(zero);

var one = "<h1>Activity 3</h1> <p>Insert content here.</p>";
textArray.push(one); 

var two = "<p>this is the second page of content. what a treat!</p>";
textArray.push(two); 

var three = "<p>this is the third page of content. yippee!</p>";
textArray.push(three); 

div.innerHTML = textArray[current]
/* function nextDiv() {
    if (!(current == textArray.length-1)){ 
        backButton.style.visibility = 'visible';
        current += 1; 
        div.innerHTML = textArray[current]; 
    }

    if (current == textArray.length-1){ 
        nextButton.style.visibility = 'hidden';
    }
    console.log(current)
} */

/* function backDiv() {
    if (current >0){ 
        nextButton.style.visibility = 'visible';
        current -= 1; 
        div.innerHTML = textArray[current]; 
    }
    if(current == 0){
        backButton.style.visibility = 'hidden';
    }
} */


