const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseCvText } = require("../../services/cvParser");

describe("cvParser.parseCvText — title extraction", () => {
  it("extracts title from first non-empty line", () => {
    const text = "John Developer\n\nSKILLS\nJavaScript, React\n";
    const result = parseCvText(text);
    assert.equal(result.title, "John Developer");
  });

  it("falls back to Imported CV when first line starts with http and no valid title in first 5 lines", () => {
    // All first 5 lines are URL/email/phone/digit — none pass extractTitle filter
    const text = "http://linkedin.com/in/john\nwww.example.com\nemail@foo.com\nphone123\n12345\nJohn Developer\n";
    const result = parseCvText(text);
    assert.equal(result.title, "Imported CV");
  });

  it("falls back to Imported CV when all first 5 lines are invalid", () => {
    const text = "http://foo.com\nwww.bar.com\nemail@foo.com\nphone123\n12345\nSKILLS\nJS\n";
    const result = parseCvText(text);
    assert.equal(result.title, "Imported CV");
  });

  it("accepts a name from the first 5 lines (not necessarily the very first)", () => {
    const text = "http://skip.com\nJane Smith\n\nSKILLS\nReact\n";
    const result = parseCvText(text);
    assert.equal(result.title, "Jane Smith");
  });
});

describe("cvParser.parseCvText — skills extraction", () => {
  it("extracts comma-separated skills", () => {
    const text = "Dev Name\n\nSKILLS\nJavaScript, React, Node.js\n";
    const result = parseCvText(text);
    assert.ok(result.skills.length >= 1);
    assert.ok(result.skills.some((s) => /javascript/i.test(s)));
  });

  it("deduplicates skills", () => {
    const text = "Dev\n\nSKILLS\nJavaScript, JavaScript, React\n";
    const result = parseCvText(text);
    const jsCount = result.skills.filter((s) => /javascript/i.test(s)).length;
    assert.equal(jsCount, 1);
  });

  it("returns empty skills array when SKILLS section is absent", () => {
    const text = "Jane Smith\n\nSUMMARY\nExperienced developer.\n";
    const result = parseCvText(text);
    assert.deepEqual(result.skills, []);
  });

  it("handles pipe-separated skills", () => {
    const text = "Dev\n\nSKILLS\nPython | Django | PostgreSQL\n";
    const result = parseCvText(text);
    assert.ok(result.skills.some((s) => /python/i.test(s)));
  });
});

describe("cvParser.parseCvText — section extraction", () => {
  it("extracts experience items", () => {
    const text = "Dev Name\n\nEXPERIENCE\nSenior Engineer at Acme\nJunior Dev at Startup\n";
    const result = parseCvText(text);
    assert.ok(result.experience.length >= 1);
  });

  it("returns empty arrays for missing sections", () => {
    const text = "Jane Smith\n\nSUMMARY\nExperienced developer.\n";
    const result = parseCvText(text);
    assert.deepEqual(result.skills, []);
    assert.deepEqual(result.experience, []);
  });

  it("caps experience at 20 items", () => {
    const manyLines = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`).join("\n");
    const text = `Dev\n\nEXPERIENCE\n${manyLines}\n`;
    const result = parseCvText(text);
    assert.ok(result.experience.length <= 20);
  });

  it("extracts projects section", () => {
    const text = "Dev\n\nPROJECTS\nOpen Source App\nPortfolio Site\n";
    const result = parseCvText(text);
    assert.ok(result.projects.length >= 1);
  });

  it("extracts education section", () => {
    const text = "Dev\n\nEDUCATION\nBSc Computer Science, MIT\n";
    const result = parseCvText(text);
    assert.ok(result.education.length >= 1);
  });

  it("extracts certifications section", () => {
    const text = "Dev\n\nCERTIFICATIONS\nAWS Certified Solutions Architect\n";
    const result = parseCvText(text);
    assert.ok(result.certifications.length >= 1);
  });

  it("extracts summary section", () => {
    const text = "Dev\n\nSUMMARY\nExperienced software engineer.\n";
    const result = parseCvText(text);
    assert.ok(result.summary.length > 0);
    assert.ok(/experienced/i.test(result.summary));
  });
});
