const fs = require('fs');
let text = fs.readFileSync('src/components/CustomerReview.tsx', 'utf8');

const replacement = `                <button
                  onClick={() => {
                    copyToClipboard();
                    toast.success("Review copied! Please paste it in Google.");
                    setTimeout(() => {
                      window.open(reviewLink, '_blank', 'noopener,noreferrer');
                    }, 800);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-[0.98]"
                >
                  <ExternalLink size={18} />
                  Post on Google
                </button>
                
                <div className="pt-4 text-center space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Click above to copy & open Google automatically.</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}`;

const regex = /<button[\s\S]*?onClick=\{copyToClipboard\}[\s\S]*?Copied to clipboard!' : 'Copy Review Text'\}[\s\S]*?<\/button>[\s\S]*?<a[\s\S]*?href=\{reviewLink\}[\s\S]*?Post on Google[\s\S]*?<\/a>[\s\S]*?<div className="pt-4 text-center space-y-1">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/>[\s\S]*?\)}[\s\S]*?<\/motion\.div>[\s\S]*?\)}/m;

const match = text.match(regex);
if (match) {
  text = text.replace(regex, replacement);
  fs.writeFileSync('src/components/CustomerReview.tsx', text);
  console.log("CustomerReview patched!");
} else {
  console.log("CustomerReview NOT patched. Regex failed.");
}
