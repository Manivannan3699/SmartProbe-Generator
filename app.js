function asciiSafe(text){

    return String(text || "")
        .replace(/[‘’]/g,"'")
        .replace(/[“”]/g,'"')
        .replace(/≤/g,"<=")
        .replace(/≥/g,">=")
        .replace(/–|—/g,"-")
        .replace(/…/g,"...")
        .replace(/[^\x00-\x7F]/g," ");
}

function esc(text){

    return asciiSafe(text)
        .replace(/\\/g,"\\\\")
        .replace(/"/g,'\\"')
        .replace(/\r/g,"")
        .replace(/\n/g," ");
}

function generateExec(){

    const qid = document.getElementById("qid").value.trim();
	const primeQuestion = esc(document.getElementById("question").value);
    const objective =
        esc(document.getElementById("objective").value);

    const modelLines =
        document.getElementById("models")
        .value
        .split("\n")
        .filter(x => x.trim());

    const targetLines =
        document.getElementById("targets")
        .value
        .split("\n")
        .filter(x => x.trim());

    let examples = [];

    modelLines.forEach(line => {

        let parts = line.split("=");

        if(parts.length < 2) return;

        let response = esc(parts.shift().trim());
        let probe = esc(parts.join("=").trim());

	examples.push(`
	{
      "prime_question": "${primeQuestion}",
      "prime_response": "${response}",
      "probe_question": "${probe}",
      "negative": true
    }`);
    });

    let targets = [];

    let letterCode = 97;

    targetLines.forEach(line => {

        let parts = line.split("=");

        if(parts.length < 3) return;

        let label = esc(parts[0].trim());

        let detection = parts[1]
            .split(",")
            .map(x => `"${esc(x.trim())}"`)
            .join(", ");

        let priority = parts[2].trim();

        let probeId =
            `${qid}_probe_1${String.fromCharCode(letterCode++)}`;

	 targets.push(`
	{
	    "id": "%%s_${probeId}",
	    "label": "${label}",
	    "priority": ${priority},
	    "detection_examples": [
	      ${detection}
	    ],
	    "action": "TRIGGER_ON_DETECTION"
	}`);
    });
	

    let uuidVars = [];

    for(let i = 0; i < targets.length; i++){
        uuidVars.push("uuid");
    }

    let output = `<exec>
p.open_headerdict${qid}={'x-api-key': '','Content-Type': 'application/json' }

p.open_datadict${qid} ='''{
 "dialogue_exchange": {
  "question": "%s",
  "response": "%s"
 },
 "lang_id": "en",
 "research_context": {
  "research category": "Topic",
  "question_objectives": "${objective}",
  "domain": "healthcare"
 },

 "training_examples": [
${examples.join(",")}
 ],

 "targets": [
${targets.join(",")}
 ]
}''' % (${qid}.title,${qid}.val,${uuidVars.join(",")})
</exec>`;

    document.getElementById("output").value = output;
}
["qid","objective","question","models","targets"].forEach(id => {

    const el = document.getElementById(id);

    el.value = localStorage.getItem(id) || "";

    el.addEventListener("input", () => {
        localStorage.setItem(id, el.value);
    });

});
