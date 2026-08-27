const fs = require('fs');
const content = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');

const replacement = `  const postReply = async (reviewName: string, replyText: string) => {
    setIsPosting(true);
    try {
      const targetUrl = \`https://mybusiness.googleapis.com/v4/\${reviewName}/reply\`;
      const res = await fetch(\`/api/gbp/reply?url=\${encodeURIComponent(targetUrl)}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ comment: replyText })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || errData.error || 'Failed to post reply');
      }
      
      setReviews(prev => prev.map(r => 
        r.name === reviewName 
          ? { 
              ...r, 
              reviewReply: { comment: replyText, updateTime: new Date().toISOString() },
              draftReply: undefined
            }
          : r
      ));
      setActiveReplyId(null);
      setDraftReply('');
      toast.success('Official response posted to Google Business Profile! 🎉');
    } catch (err: any) {
      console.error("Failed to post reply to GBP", err);
      toast.error(\`Error: \${err.message}\`);
    } finally {
      setIsPosting(false);
    }
  };`;

const regex = /const postReply = \(reviewName: string, replyText: string\) => \{[\s\S]*?toast\.success\('Official response posted to Google Business Profile! 🎉'\);\n    \}, 700\);\n  \};/m;
const match = content.match(regex);
if (match) {
  fs.writeFileSync('src/components/OwnerDashboard.tsx', content.replace(regex, replacement));
  console.log("Replaced postReply via regex!");
} else {
  console.log("postReply Regex failed.");
}
