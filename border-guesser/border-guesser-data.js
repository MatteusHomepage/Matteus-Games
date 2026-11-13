const CDATA = `004|AF|Afghanistan|AS
008|AL|Albania|EU
012|DZ|Algeria|AF
020|AD|Andorra|EU
024|AO|Angola|AF
032|AR|Argentina|SA
051|AM|Armenia|AS
036|AU|Australia|OC
040|AT|Austria|EU
031|AZ|Azerbaijan|AS
044|BS|Bahamas|NA
048|BH|Bahrain|AS
050|BD|Bangladesh|AS
112|BY|Belarus|EU
056|BE|Belgium|EU
084|BZ|Belize|NA
204|BJ|Benin|AF
064|BT|Bhutan|AS
068|BO|Bolivia|SA
070|BA|Bosnia and Herzegovina|EU
072|BW|Botswana|AF
076|BR|Brazil|SA
096|BN|Brunei|AS
100|BG|Bulgaria|EU
854|BF|Burkina Faso|AF
108|BI|Burundi|AF
116|KH|Cambodia|AS
120|CM|Cameroon|AF
124|CA|Canada|NA
132|CV|Cape Verde|AF
140|CF|Central African Republic|AF
148|TD|Chad|AF
152|CL|Chile|SA
156|CN|China|AS
170|CO|Colombia|SA
174|KM|Comoros|AF
178|CG|Republic of the Congo|AF
180|CD|DR Congo|AF
188|CR|Costa Rica|NA
384|CI|Ivory Coast|AF
191|HR|Croatia|EU
192|CU|Cuba|NA
196|CY|Cyprus|AS
203|CZ|Czechia|EU
208|DK|Denmark|EU
262|DJ|Djibouti|AF
214|DO|Dominican Republic|NA
218|EC|Ecuador|SA
818|EG|Egypt|AF
222|SV|El Salvador|NA
226|GQ|Equatorial Guinea|AF
232|ER|Eritrea|AF
233|EE|Estonia|EU
748|SZ|Eswatini|AF
231|ET|Ethiopia|AF
242|FJ|Fiji|OC
246|FI|Finland|EU
250|FR|France|EU
266|GA|Gabon|AF
270|GM|Gambia|AF
268|GE|Georgia|AS
276|DE|Germany|EU
288|GH|Ghana|AF
300|GR|Greece|EU
304|GL|Greenland|NA
320|GT|Guatemala|NA
324|GN|Guinea|AF
624|GW|Guinea-Bissau|AF
328|GY|Guyana|SA
332|HT|Haiti|NA
340|HN|Honduras|NA
348|HU|Hungary|EU
352|IS|Iceland|EU
356|IN|India|AS
360|ID|Indonesia|AS
364|IR|Iran|AS
368|IQ|Iraq|AS
372|IE|Ireland|EU
376|IL|Israel|AS
380|IT|Italy|EU
388|JM|Jamaica|NA
392|JP|Japan|AS
400|JO|Jordan|AS
398|KZ|Kazakhstan|AS
404|KE|Kenya|AF
296|KI|Kiribati|OC
408|KP|North Korea|AS
410|KR|South Korea|AS
414|KW|Kuwait|AS
417|KG|Kyrgyzstan|AS
418|LA|Laos|AS
428|LV|Latvia|EU
422|LB|Lebanon|AS
426|LS|Lesotho|AF
430|LR|Liberia|AF
434|LY|Libya|AF
438|LI|Liechtenstein|EU
440|LT|Lithuania|EU
442|LU|Luxembourg|EU
450|MG|Madagascar|AF
454|MW|Malawi|AF
458|MY|Malaysia|AS
462|MV|Maldives|AS
466|ML|Mali|AF
470|MT|Malta|EU
478|MR|Mauritania|AF
480|MU|Mauritius|AF
484|MX|Mexico|NA
498|MD|Moldova|EU
492|MC|Monaco|EU
496|MN|Mongolia|AS
499|ME|Montenegro|EU
504|MA|Morocco|AF
508|MZ|Mozambique|AF
104|MM|Myanmar|AS
516|NA|Namibia|AF
524|NP|Nepal|AS
528|NL|Netherlands|EU
554|NZ|New Zealand|OC
558|NI|Nicaragua|NA
562|NE|Niger|AF
566|NG|Nigeria|AF
807|MK|North Macedonia|EU
578|NO|Norway|EU
512|OM|Oman|AS
586|PK|Pakistan|AS
275|PS|Palestine|AS
591|PA|Panama|NA
598|PG|Papua New Guinea|OC
600|PY|Paraguay|SA
604|PE|Peru|SA
608|PH|Philippines|AS
616|PL|Poland|EU
620|PT|Portugal|EU
634|QA|Qatar|AS
642|RO|Romania|EU
643|RU|Russia|EU
646|RW|Rwanda|AF
882|WS|Samoa|OC
674|SM|San Marino|EU
678|ST|Sao Tome and Principe|AF
682|SA|Saudi Arabia|AS
686|SN|Senegal|AF
688|RS|Serbia|EU
690|SC|Seychelles|AF
694|SL|Sierra Leone|AF
702|SG|Singapore|AS
703|SK|Slovakia|EU
705|SI|Slovenia|EU
090|SB|Solomon Islands|OC
706|SO|Somalia|AF
710|ZA|South Africa|AF
728|SS|South Sudan|AF
724|ES|Spain|EU
144|LK|Sri Lanka|AS
729|SD|Sudan|AF
740|SR|Suriname|SA
752|SE|Sweden|EU
756|CH|Switzerland|EU
760|SY|Syria|AS
158|TW|Taiwan|AS
762|TJ|Tajikistan|AS
834|TZ|Tanzania|AF
764|TH|Thailand|AS
626|TL|Timor-Leste|AS
768|TG|Togo|AF
776|TO|Tonga|OC
780|TT|Trinidad and Tobago|NA
788|TN|Tunisia|AF
792|TR|Turkey|AS
795|TM|Turkmenistan|AS
800|UG|Uganda|AF
804|UA|Ukraine|EU
784|AE|United Arab Emirates|AS
826|GB|United Kingdom|EU
840|US|United States|NA
858|UY|Uruguay|SA
860|UZ|Uzbekistan|AS
548|VU|Vanuatu|OC
336|VA|Vatican City|EU
862|VE|Venezuela|SA
704|VN|Vietnam|AS
887|YE|Yemen|AS
894|ZM|Zambia|AF
716|ZW|Zimbabwe|AF
XKX|XK|Kosovo|EU`;
const EDGE_STR =
  "AE:OM,SA;AF:CN,IR,PK,TJ,TM,UZ;AL:GR,ME,MK,XK;AM:AZ,GE,IR,TR;AO:CD,CG,NA,ZM;AR:BO,BR,CL,PY,UY;AT:CH,CZ,DE,HU,IT,SI,SK;AZ:GE,IR,RU,TR;BA:HR,ME,RS;BD:IN,MM;BE:DE,FR,LU,NL;BF:BJ,CI,GH,ML,NE,TG;BG:GR,MK,RO,RS,TR;BI:CD,RW,TZ;BJ:NE,NG,TG;BN:MY;BO:BR,CL,PE,PY;BR:CO,GY,PE,PY,SR,UY,VE;BT:CN,IN;BW:NA,ZA,ZM,ZW;BY:LT,LV,PL,RU,UA;BZ:GT,MX;CA:US;CD:CF,CG,RW,SS,TZ,UG,ZM;CF:CG,CM,SD,SS,TD;CG:CM,GA;CH:DE,FR,IT;CI:GH,GN,LR,ML;CL:PE;CM:GA,GQ,NG,TD;CN:IN,KG,KP,KZ,LA,MM,MN,NP,PK,RU,TJ,VN;CO:EC,PA,PE,VE;CR:NI,PA;CZ:DE,PL,SK;DE:DK,FR,LU,NL,PL;DJ:ER,ET,SO;DZ:LY,MA,ML,MR,NE,TN;EC:PE;EE:LV,RU;EG:IL,LY,PS,SD;ER:ET,SD;ES:FR,PT;ET:KE,SD,SO,SS;FI:NO,RU,SE;FR:IT,LU;GA:GQ;GB:IE;GE:RU,TR;GH:TG;GM:SN;GN:GW,LR,ML,SL,SN;GR:MK,TR;GT:HN,MX,SV;GW:SN;GY:SR,VE;HN:NI,SV;HR:HU,ME,RS,SI;HU:RO,RS,SI,SK,UA;ID:MY,TL;IL:JO,LB,PS,SY;IN:MM,NP,PK;IQ:IR,JO,KW,SA,SY,TR;IR:PK,TM,TR;IT:SI;JO:PS,SA,SY;KE:SO,SS,TZ,UG;KG:KZ,TJ,UZ;KH:LA,TH,VN;KP:KR,RU;KW:SA;KZ:RU,TM,UZ;LA:MM,TH,VN;LB:SY;LR:SL;LS:ZA;LT:LV,PL,RU;LV:RU;LY:NE,SD,TD,TN;MD:RO,UA;ME:RS,XK;MK:RS,XK;ML:MR,NE,SN;MM:TH;MN:RU;MR:SN;MW:MZ,TZ,ZM;MX:US;MY:TH;MZ:SZ,TZ,ZA,ZM,ZW;NA:ZA,ZM;NE:NG,TD;NG:TD;NO:RU,SE;OM:SA,YE;PL:RU,SK,UA;QA:SA;RO:RS,UA;RS:XK;RU:UA;RW:TZ,UG;SA:YE;SD:SS,TD;SK:UA;SS:UG;SY:TR;SZ:ZA;TJ:UZ;TM:UZ;TZ:UG,ZM;ZA:ZW;ZM:ZW";
const FAMOUS = new Set(
  "US CA MX BR AR CO PE CL VE FR DE IT ES PT GB IE NL BE CH AT PL CZ HU GR SE NO FI DK RU UA TR EG MA DZ LY SD ET KE TZ ZA NG GH SN CN IN PK AF IR IQ SA IL JO SY TH VN MM MY ID KR KP MN KZ UZ RO BG RS HR PA CR CD AO ZM ZW NA MZ".split(
    " ",
  ),
);
const ALIASES = {
  US: ["usa", "united states of america", "america", "us"],
  GB: ["uk", "great britain", "britain", "england", "scotland", "wales"],
  CZ: ["czech republic"],
  CI: ["cote d'ivoire", "côte d'ivoire"],
  CD: [
    "drc",
    "dr congo",
    "democratic republic of the congo",
    "congo kinshasa",
    "congo-kinshasa",
  ],
  CG: ["congo", "congo brazzaville", "congo-brazzaville", "republic of congo"],
  SZ: ["swaziland"],
  MM: ["burma"],
  MK: ["macedonia"],
  NL: ["holland", "the netherlands"],
  AE: ["uae", "emirates"],
  KR: ["korea", "republic of korea"],
  KP: ["korea", "dprk"],
  TL: ["east timor", "timor leste"],
  TR: ["turkiye", "türkiye"],
  RU: ["russian federation"],
  IR: ["persia"],
  BA: ["bosnia", "herzegovina"],
  PS: ["palestinian territories", "gaza", "west bank"],
  CV: ["cabo verde"],
  VA: ["vatican", "holy see"],
  ST: ["sao tome"],
  BN: ["brunei darussalam"],
  LA: ["lao"],
  SY: ["syrian arab republic"],
  GM: ["the gambia"],
  BS: ["the bahamas"],
};
