export class CCH2 {
    static async analyze() {
        await retrieveFiles();
    }
}

async function retrieveFiles() {
    const url =
        "https://www.cch2.org/portal/checklists/checklist.php?clid=74&pid=3&dynclid=0&dllist.x=12&dllist.y=16";
    const response = await fetch(url, { method: "POST" });
    console.log(response);
    const data = await response.blob();
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(buffer.toString("utf8"));
}
