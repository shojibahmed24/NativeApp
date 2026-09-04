const dns = require('dns');
dns.lookup('kxkabnahclcsitfkllvg.supabase.co', { all: true }, (err, addresses) => {
  if (err) console.error(err);
  else console.log(addresses);
});
