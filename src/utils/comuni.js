// ============================================================
// UTILITY COMUNI ITALIANI
// Database CAP → Comune → Provincia
// Fonte: dati ISTAT - principali comuni italiani
// ============================================================

// Database comuni con CAP multipli
const COMUNI_DB = [
  // ABRUZZO
  {"cap":"65100","nome":"Pescara","provincia":"PE"},{"cap":"66100","nome":"Chieti","provincia":"CH"},
  {"cap":"67100","nome":"L'Aquila","provincia":"AQ"},{"cap":"64100","nome":"Teramo","provincia":"TE"},
  // BASILICATA
  {"cap":"85100","nome":"Potenza","provincia":"PZ"},{"cap":"75100","nome":"Matera","provincia":"MT"},
  // CALABRIA
  {"cap":"87100","nome":"Cosenza","provincia":"CS"},{"cap":"88100","nome":"Catanzaro","provincia":"CZ"},
  {"cap":"89100","nome":"Reggio Calabria","provincia":"RC"},{"cap":"88900","nome":"Crotone","provincia":"KR"},
  {"cap":"89900","nome":"Vibo Valentia","provincia":"VV"},
  // CAMPANIA
  {"cap":"80100","nome":"Napoli","provincia":"NA"},{"cap":"80121","nome":"Napoli","provincia":"NA"},
  {"cap":"80122","nome":"Napoli","provincia":"NA"},{"cap":"80123","nome":"Napoli","provincia":"NA"},
  {"cap":"80124","nome":"Napoli","provincia":"NA"},{"cap":"80125","nome":"Napoli","provincia":"NA"},
  {"cap":"80126","nome":"Napoli","provincia":"NA"},{"cap":"80127","nome":"Napoli","provincia":"NA"},
  {"cap":"80128","nome":"Napoli","provincia":"NA"},{"cap":"80129","nome":"Napoli","provincia":"NA"},
  {"cap":"80130","nome":"Napoli","provincia":"NA"},{"cap":"80131","nome":"Napoli","provincia":"NA"},
  {"cap":"80132","nome":"Napoli","provincia":"NA"},{"cap":"80133","nome":"Napoli","provincia":"NA"},
  {"cap":"80134","nome":"Napoli","provincia":"NA"},{"cap":"80135","nome":"Napoli","provincia":"NA"},
  {"cap":"80136","nome":"Napoli","provincia":"NA"},{"cap":"80137","nome":"Napoli","provincia":"NA"},
  {"cap":"80138","nome":"Napoli","provincia":"NA"},{"cap":"80139","nome":"Napoli","provincia":"NA"},
  {"cap":"80140","nome":"Napoli","provincia":"NA"},{"cap":"80141","nome":"Napoli","provincia":"NA"},
  {"cap":"80142","nome":"Napoli","provincia":"NA"},{"cap":"80143","nome":"Napoli","provincia":"NA"},
  {"cap":"80144","nome":"Napoli","provincia":"NA"},{"cap":"80145","nome":"Napoli","provincia":"NA"},
  {"cap":"80146","nome":"Napoli","provincia":"NA"},{"cap":"80147","nome":"Napoli","provincia":"NA"},
  {"cap":"80011","nome":"Acerra","provincia":"NA"},{"cap":"80021","nome":"Afragola","provincia":"NA"},
  {"cap":"80022","nome":"Arzano","provincia":"NA"},{"cap":"80031","nome":"Brusciano","provincia":"NA"},
  {"cap":"80033","nome":"Cicciano","provincia":"NA"},{"cap":"80040","nome":"Cercola","provincia":"NA"},
  {"cap":"80035","nome":"Nola","provincia":"NA"},{"cap":"80045","nome":"Pompei","provincia":"NA"},
  {"cap":"80058","nome":"Torre Annunziata","provincia":"NA"},{"cap":"80059","nome":"Torre del Greco","provincia":"NA"},
  {"cap":"84100","nome":"Salerno","provincia":"SA"},{"cap":"83100","nome":"Avellino","provincia":"AV"},
  {"cap":"82100","nome":"Benevento","provincia":"BN"},{"cap":"81100","nome":"Caserta","provincia":"CE"},
  // EMILIA ROMAGNA
  {"cap":"40100","nome":"Bologna","provincia":"BO"},{"cap":"40121","nome":"Bologna","provincia":"BO"},
  {"cap":"40122","nome":"Bologna","provincia":"BO"},{"cap":"40123","nome":"Bologna","provincia":"BO"},
  {"cap":"40124","nome":"Bologna","provincia":"BO"},{"cap":"40125","nome":"Bologna","provincia":"BO"},
  {"cap":"40126","nome":"Bologna","provincia":"BO"},{"cap":"40127","nome":"Bologna","provincia":"BO"},
  {"cap":"40128","nome":"Bologna","provincia":"BO"},{"cap":"40129","nome":"Bologna","provincia":"BO"},
  {"cap":"40130","nome":"Bologna","provincia":"BO"},{"cap":"40131","nome":"Bologna","provincia":"BO"},
  {"cap":"40132","nome":"Bologna","provincia":"BO"},{"cap":"40133","nome":"Bologna","provincia":"BO"},
  {"cap":"40134","nome":"Bologna","provincia":"BO"},{"cap":"40135","nome":"Bologna","provincia":"BO"},
  {"cap":"40136","nome":"Bologna","provincia":"BO"},{"cap":"40137","nome":"Bologna","provincia":"BO"},
  {"cap":"40138","nome":"Bologna","provincia":"BO"},{"cap":"40139","nome":"Bologna","provincia":"BO"},
  {"cap":"44100","nome":"Ferrara","provincia":"FE"},{"cap":"47100","nome":"Forlì","provincia":"FC"},
  {"cap":"47900","nome":"Rimini","provincia":"RN"},{"cap":"42100","nome":"Reggio Emilia","provincia":"RE"},
  {"cap":"41100","nome":"Modena","provincia":"MO"},{"cap":"43100","nome":"Parma","provincia":"PR"},
  {"cap":"29100","nome":"Piacenza","provincia":"PC"},{"cap":"48100","nome":"Ravenna","provincia":"RA"},
  // FRIULI VENEZIA GIULIA
  {"cap":"34100","nome":"Trieste","provincia":"TS"},{"cap":"33100","nome":"Udine","provincia":"UD"},
  {"cap":"34170","nome":"Gorizia","provincia":"GO"},{"cap":"33170","nome":"Pordenone","provincia":"PN"},
  // LAZIO
  {"cap":"00100","nome":"Roma","provincia":"RM"},{"cap":"00118","nome":"Roma","provincia":"RM"},
  {"cap":"00119","nome":"Roma","provincia":"RM"},{"cap":"00120","nome":"Roma","provincia":"RM"},
  {"cap":"00121","nome":"Roma","provincia":"RM"},{"cap":"00122","nome":"Roma","provincia":"RM"},
  {"cap":"00123","nome":"Roma","provincia":"RM"},{"cap":"00124","nome":"Roma","provincia":"RM"},
  {"cap":"00125","nome":"Roma","provincia":"RM"},{"cap":"00126","nome":"Roma","provincia":"RM"},
  {"cap":"00127","nome":"Roma","provincia":"RM"},{"cap":"00128","nome":"Roma","provincia":"RM"},
  {"cap":"00129","nome":"Roma","provincia":"RM"},{"cap":"00130","nome":"Roma","provincia":"RM"},
  {"cap":"00131","nome":"Roma","provincia":"RM"},{"cap":"00132","nome":"Roma","provincia":"RM"},
  {"cap":"00133","nome":"Roma","provincia":"RM"},{"cap":"00134","nome":"Roma","provincia":"RM"},
  {"cap":"00135","nome":"Roma","provincia":"RM"},{"cap":"00136","nome":"Roma","provincia":"RM"},
  {"cap":"00137","nome":"Roma","provincia":"RM"},{"cap":"00138","nome":"Roma","provincia":"RM"},
  {"cap":"00139","nome":"Roma","provincia":"RM"},{"cap":"00140","nome":"Roma","provincia":"RM"},
  {"cap":"00141","nome":"Roma","provincia":"RM"},{"cap":"00142","nome":"Roma","provincia":"RM"},
  {"cap":"00143","nome":"Roma","provincia":"RM"},{"cap":"00144","nome":"Roma","provincia":"RM"},
  {"cap":"00145","nome":"Roma","provincia":"RM"},{"cap":"00146","nome":"Roma","provincia":"RM"},
  {"cap":"00147","nome":"Roma","provincia":"RM"},{"cap":"00148","nome":"Roma","provincia":"RM"},
  {"cap":"00149","nome":"Roma","provincia":"RM"},{"cap":"00150","nome":"Roma","provincia":"RM"},
  {"cap":"00151","nome":"Roma","provincia":"RM"},{"cap":"00152","nome":"Roma","provincia":"RM"},
  {"cap":"00153","nome":"Roma","provincia":"RM"},{"cap":"00154","nome":"Roma","provincia":"RM"},
  {"cap":"00155","nome":"Roma","provincia":"RM"},{"cap":"00156","nome":"Roma","provincia":"RM"},
  {"cap":"00157","nome":"Roma","provincia":"RM"},{"cap":"00158","nome":"Roma","provincia":"RM"},
  {"cap":"00159","nome":"Roma","provincia":"RM"},{"cap":"00160","nome":"Roma","provincia":"RM"},
  {"cap":"00161","nome":"Roma","provincia":"RM"},{"cap":"00162","nome":"Roma","provincia":"RM"},
  {"cap":"00163","nome":"Roma","provincia":"RM"},{"cap":"00164","nome":"Roma","provincia":"RM"},
  {"cap":"00165","nome":"Roma","provincia":"RM"},{"cap":"00166","nome":"Roma","provincia":"RM"},
  {"cap":"00167","nome":"Roma","provincia":"RM"},{"cap":"00168","nome":"Roma","provincia":"RM"},
  {"cap":"00169","nome":"Roma","provincia":"RM"},{"cap":"00170","nome":"Roma","provincia":"RM"},
  {"cap":"00171","nome":"Roma","provincia":"RM"},{"cap":"00172","nome":"Roma","provincia":"RM"},
  {"cap":"00173","nome":"Roma","provincia":"RM"},{"cap":"00174","nome":"Roma","provincia":"RM"},
  {"cap":"00175","nome":"Roma","provincia":"RM"},{"cap":"00176","nome":"Roma","provincia":"RM"},
  {"cap":"00177","nome":"Roma","provincia":"RM"},{"cap":"00178","nome":"Roma","provincia":"RM"},
  {"cap":"00179","nome":"Roma","provincia":"RM"},{"cap":"00180","nome":"Roma","provincia":"RM"},
  {"cap":"00181","nome":"Roma","provincia":"RM"},{"cap":"00182","nome":"Roma","provincia":"RM"},
  {"cap":"00183","nome":"Roma","provincia":"RM"},{"cap":"00184","nome":"Roma","provincia":"RM"},
  {"cap":"00185","nome":"Roma","provincia":"RM"},{"cap":"00186","nome":"Roma","provincia":"RM"},
  {"cap":"00187","nome":"Roma","provincia":"RM"},{"cap":"00188","nome":"Roma","provincia":"RM"},
  {"cap":"00189","nome":"Roma","provincia":"RM"},{"cap":"00190","nome":"Roma","provincia":"RM"},
  {"cap":"00191","nome":"Roma","provincia":"RM"},{"cap":"00192","nome":"Roma","provincia":"RM"},
  {"cap":"00193","nome":"Roma","provincia":"RM"},{"cap":"00194","nome":"Roma","provincia":"RM"},
  {"cap":"00195","nome":"Roma","provincia":"RM"},{"cap":"00196","nome":"Roma","provincia":"RM"},
  {"cap":"00197","nome":"Roma","provincia":"RM"},{"cap":"00198","nome":"Roma","provincia":"RM"},
  {"cap":"00199","nome":"Roma","provincia":"RM"},
  {"cap":"04100","nome":"Latina","provincia":"LT"},{"cap":"03100","nome":"Frosinone","provincia":"FR"},
  {"cap":"01100","nome":"Viterbo","provincia":"VT"},{"cap":"02100","nome":"Rieti","provincia":"RI"},
  // LIGURIA
  {"cap":"16100","nome":"Genova","provincia":"GE"},{"cap":"16121","nome":"Genova","provincia":"GE"},
  {"cap":"16122","nome":"Genova","provincia":"GE"},{"cap":"16123","nome":"Genova","provincia":"GE"},
  {"cap":"16124","nome":"Genova","provincia":"GE"},{"cap":"16125","nome":"Genova","provincia":"GE"},
  {"cap":"16126","nome":"Genova","provincia":"GE"},{"cap":"16127","nome":"Genova","provincia":"GE"},
  {"cap":"16128","nome":"Genova","provincia":"GE"},{"cap":"16129","nome":"Genova","provincia":"GE"},
  {"cap":"16130","nome":"Genova","provincia":"GE"},{"cap":"16131","nome":"Genova","provincia":"GE"},
  {"cap":"16132","nome":"Genova","provincia":"GE"},{"cap":"16133","nome":"Genova","provincia":"GE"},
  {"cap":"16134","nome":"Genova","provincia":"GE"},{"cap":"16135","nome":"Genova","provincia":"GE"},
  {"cap":"16136","nome":"Genova","provincia":"GE"},{"cap":"16137","nome":"Genova","provincia":"GE"},
  {"cap":"16138","nome":"Genova","provincia":"GE"},{"cap":"16139","nome":"Genova","provincia":"GE"},
  {"cap":"16140","nome":"Genova","provincia":"GE"},{"cap":"16141","nome":"Genova","provincia":"GE"},
  {"cap":"16142","nome":"Genova","provincia":"GE"},{"cap":"16143","nome":"Genova","provincia":"GE"},
  {"cap":"16144","nome":"Genova","provincia":"GE"},{"cap":"16145","nome":"Genova","provincia":"GE"},
  {"cap":"16146","nome":"Genova","provincia":"GE"},{"cap":"16147","nome":"Genova","provincia":"GE"},
  {"cap":"16148","nome":"Genova","provincia":"GE"},{"cap":"16149","nome":"Genova","provincia":"GE"},
  {"cap":"16150","nome":"Genova","provincia":"GE"},{"cap":"16151","nome":"Genova","provincia":"GE"},
  {"cap":"16152","nome":"Genova","provincia":"GE"},{"cap":"16153","nome":"Genova","provincia":"GE"},
  {"cap":"16154","nome":"Genova","provincia":"GE"},{"cap":"16155","nome":"Genova","provincia":"GE"},
  {"cap":"16156","nome":"Genova","provincia":"GE"},{"cap":"16157","nome":"Genova","provincia":"GE"},
  {"cap":"16158","nome":"Genova","provincia":"GE"},{"cap":"16159","nome":"Genova","provincia":"GE"},
  {"cap":"17100","nome":"Savona","provincia":"SV"},{"cap":"18100","nome":"Imperia","provincia":"IM"},
  {"cap":"19100","nome":"La Spezia","provincia":"SP"},
  // LOMBARDIA
  {"cap":"20100","nome":"Milano","provincia":"MI"},{"cap":"20121","nome":"Milano","provincia":"MI"},
  {"cap":"20122","nome":"Milano","provincia":"MI"},{"cap":"20123","nome":"Milano","provincia":"MI"},
  {"cap":"20124","nome":"Milano","provincia":"MI"},{"cap":"20125","nome":"Milano","provincia":"MI"},
  {"cap":"20126","nome":"Milano","provincia":"MI"},{"cap":"20127","nome":"Milano","provincia":"MI"},
  {"cap":"20128","nome":"Milano","provincia":"MI"},{"cap":"20129","nome":"Milano","provincia":"MI"},
  {"cap":"20130","nome":"Milano","provincia":"MI"},{"cap":"20131","nome":"Milano","provincia":"MI"},
  {"cap":"20132","nome":"Milano","provincia":"MI"},{"cap":"20133","nome":"Milano","provincia":"MI"},
  {"cap":"20134","nome":"Milano","provincia":"MI"},{"cap":"20135","nome":"Milano","provincia":"MI"},
  {"cap":"20136","nome":"Milano","provincia":"MI"},{"cap":"20137","nome":"Milano","provincia":"MI"},
  {"cap":"20138","nome":"Milano","provincia":"MI"},{"cap":"20139","nome":"Milano","provincia":"MI"},
  {"cap":"20140","nome":"Milano","provincia":"MI"},{"cap":"20141","nome":"Milano","provincia":"MI"},
  {"cap":"20142","nome":"Milano","provincia":"MI"},{"cap":"20143","nome":"Milano","provincia":"MI"},
  {"cap":"20144","nome":"Milano","provincia":"MI"},{"cap":"20145","nome":"Milano","provincia":"MI"},
  {"cap":"20146","nome":"Milano","provincia":"MI"},{"cap":"20147","nome":"Milano","provincia":"MI"},
  {"cap":"20148","nome":"Milano","provincia":"MI"},{"cap":"20149","nome":"Milano","provincia":"MI"},
  {"cap":"20151","nome":"Milano","provincia":"MI"},{"cap":"20152","nome":"Milano","provincia":"MI"},
  {"cap":"20153","nome":"Milano","provincia":"MI"},{"cap":"20154","nome":"Milano","provincia":"MI"},
  {"cap":"20155","nome":"Milano","provincia":"MI"},{"cap":"20156","nome":"Milano","provincia":"MI"},
  {"cap":"20157","nome":"Milano","provincia":"MI"},{"cap":"20158","nome":"Milano","provincia":"MI"},
  {"cap":"20159","nome":"Milano","provincia":"MI"},{"cap":"20160","nome":"Milano","provincia":"MI"},
  {"cap":"20161","nome":"Milano","provincia":"MI"},{"cap":"20162","nome":"Milano","provincia":"MI"},
  {"cap":"24100","nome":"Bergamo","provincia":"BG"},{"cap":"25100","nome":"Brescia","provincia":"BS"},
  {"cap":"22100","nome":"Como","provincia":"CO"},{"cap":"26100","nome":"Cremona","provincia":"CR"},
  {"cap":"23900","nome":"Lecco","provincia":"LC"},{"cap":"26900","nome":"Lodi","provincia":"LO"},
  {"cap":"46100","nome":"Mantova","provincia":"MN"},{"cap":"20900","nome":"Monza","provincia":"MB"},
  {"cap":"27100","nome":"Pavia","provincia":"PV"},{"cap":"23100","nome":"Sondrio","provincia":"SO"},
  {"cap":"21100","nome":"Varese","provincia":"VA"},
  // MARCHE
  {"cap":"60100","nome":"Ancona","provincia":"AN"},{"cap":"63100","nome":"Ascoli Piceno","provincia":"AP"},
  {"cap":"62100","nome":"Macerata","provincia":"MC"},{"cap":"61100","nome":"Pesaro","provincia":"PU"},
  {"cap":"63900","nome":"Fermo","provincia":"FM"},
  // MOLISE
  {"cap":"86100","nome":"Campobasso","provincia":"CB"},{"cap":"86170","nome":"Isernia","provincia":"IS"},
  // PIEMONTE
  {"cap":"10100","nome":"Torino","provincia":"TO"},{"cap":"10121","nome":"Torino","provincia":"TO"},
  {"cap":"10122","nome":"Torino","provincia":"TO"},{"cap":"10123","nome":"Torino","provincia":"TO"},
  {"cap":"10124","nome":"Torino","provincia":"TO"},{"cap":"10125","nome":"Torino","provincia":"TO"},
  {"cap":"10126","nome":"Torino","provincia":"TO"},{"cap":"10127","nome":"Torino","provincia":"TO"},
  {"cap":"10128","nome":"Torino","provincia":"TO"},{"cap":"10129","nome":"Torino","provincia":"TO"},
  {"cap":"10130","nome":"Torino","provincia":"TO"},{"cap":"10131","nome":"Torino","provincia":"TO"},
  {"cap":"10132","nome":"Torino","provincia":"TO"},{"cap":"10133","nome":"Torino","provincia":"TO"},
  {"cap":"10134","nome":"Torino","provincia":"TO"},{"cap":"10135","nome":"Torino","provincia":"TO"},
  {"cap":"10136","nome":"Torino","provincia":"TO"},{"cap":"10137","nome":"Torino","provincia":"TO"},
  {"cap":"10138","nome":"Torino","provincia":"TO"},{"cap":"10139","nome":"Torino","provincia":"TO"},
  {"cap":"10140","nome":"Torino","provincia":"TO"},{"cap":"10141","nome":"Torino","provincia":"TO"},
  {"cap":"10142","nome":"Torino","provincia":"TO"},{"cap":"10143","nome":"Torino","provincia":"TO"},
  {"cap":"10144","nome":"Torino","provincia":"TO"},{"cap":"10145","nome":"Torino","provincia":"TO"},
  {"cap":"10146","nome":"Torino","provincia":"TO"},{"cap":"10147","nome":"Torino","provincia":"TO"},
  {"cap":"10148","nome":"Torino","provincia":"TO"},{"cap":"10149","nome":"Torino","provincia":"TO"},
  {"cap":"10150","nome":"Torino","provincia":"TO"},{"cap":"10151","nome":"Torino","provincia":"TO"},
  {"cap":"10152","nome":"Torino","provincia":"TO"},{"cap":"10153","nome":"Torino","provincia":"TO"},
  {"cap":"10154","nome":"Torino","provincia":"TO"},{"cap":"10155","nome":"Torino","provincia":"TO"},
  {"cap":"10156","nome":"Torino","provincia":"TO"},
  {"cap":"15100","nome":"Alessandria","provincia":"AL"},{"cap":"14100","nome":"Asti","provincia":"AT"},
  {"cap":"13900","nome":"Biella","provincia":"BI"},{"cap":"12100","nome":"Cuneo","provincia":"CN"},
  {"cap":"28100","nome":"Novara","provincia":"NO"},{"cap":"28921","nome":"Verbania","provincia":"VB"},
  {"cap":"13100","nome":"Vercelli","provincia":"VC"},
  // PUGLIA
  {"cap":"70100","nome":"Bari","provincia":"BA"},{"cap":"70121","nome":"Bari","provincia":"BA"},
  {"cap":"70122","nome":"Bari","provincia":"BA"},{"cap":"70123","nome":"Bari","provincia":"BA"},
  {"cap":"70124","nome":"Bari","provincia":"BA"},{"cap":"70125","nome":"Bari","provincia":"BA"},
  {"cap":"70126","nome":"Bari","provincia":"BA"},{"cap":"70127","nome":"Bari","provincia":"BA"},
  {"cap":"70128","nome":"Bari","provincia":"BA"},{"cap":"70129","nome":"Bari","provincia":"BA"},
  {"cap":"70130","nome":"Bari","provincia":"BA"},{"cap":"70131","nome":"Bari","provincia":"BA"},
  {"cap":"70132","nome":"Bari","provincia":"BA"},
  {"cap":"72100","nome":"Brindisi","provincia":"BR"},{"cap":"76100","nome":"BAT - Barletta","provincia":"BT"},
  {"cap":"71100","nome":"Foggia","provincia":"FG"},{"cap":"73100","nome":"Lecce","provincia":"LE"},
  {"cap":"74100","nome":"Taranto","provincia":"TA"},
  // SARDEGNA
  {"cap":"09100","nome":"Cagliari","provincia":"CA"},{"cap":"08100","nome":"Nuoro","provincia":"NU"},
  {"cap":"09170","nome":"Oristano","provincia":"OR"},{"cap":"07100","nome":"Sassari","provincia":"SS"},
  {"cap":"07026","nome":"Olbia","provincia":"SS"},
  // SICILIA
  {"cap":"90100","nome":"Palermo","provincia":"PA"},{"cap":"90121","nome":"Palermo","provincia":"PA"},
  {"cap":"90122","nome":"Palermo","provincia":"PA"},{"cap":"90123","nome":"Palermo","provincia":"PA"},
  {"cap":"90124","nome":"Palermo","provincia":"PA"},{"cap":"90125","nome":"Palermo","provincia":"PA"},
  {"cap":"90126","nome":"Palermo","provincia":"PA"},{"cap":"90127","nome":"Palermo","provincia":"PA"},
  {"cap":"90128","nome":"Palermo","provincia":"PA"},{"cap":"90129","nome":"Palermo","provincia":"PA"},
  {"cap":"90130","nome":"Palermo","provincia":"PA"},{"cap":"90131","nome":"Palermo","provincia":"PA"},
  {"cap":"90132","nome":"Palermo","provincia":"PA"},{"cap":"90133","nome":"Palermo","provincia":"PA"},
  {"cap":"90134","nome":"Palermo","provincia":"PA"},{"cap":"90135","nome":"Palermo","provincia":"PA"},
  {"cap":"90136","nome":"Palermo","provincia":"PA"},{"cap":"90137","nome":"Palermo","provincia":"PA"},
  {"cap":"90138","nome":"Palermo","provincia":"PA"},{"cap":"90139","nome":"Palermo","provincia":"PA"},
  {"cap":"90140","nome":"Palermo","provincia":"PA"},{"cap":"90141","nome":"Palermo","provincia":"PA"},
  {"cap":"90142","nome":"Palermo","provincia":"PA"},{"cap":"90143","nome":"Palermo","provincia":"PA"},
  {"cap":"90144","nome":"Palermo","provincia":"PA"},{"cap":"90145","nome":"Palermo","provincia":"PA"},
  {"cap":"90146","nome":"Palermo","provincia":"PA"},{"cap":"90147","nome":"Palermo","provincia":"PA"},
  {"cap":"95100","nome":"Catania","provincia":"CT"},{"cap":"95121","nome":"Catania","provincia":"CT"},
  {"cap":"95122","nome":"Catania","provincia":"CT"},{"cap":"95123","nome":"Catania","provincia":"CT"},
  {"cap":"95124","nome":"Catania","provincia":"CT"},{"cap":"95125","nome":"Catania","provincia":"CT"},
  {"cap":"95126","nome":"Catania","provincia":"CT"},{"cap":"95127","nome":"Catania","provincia":"CT"},
  {"cap":"95128","nome":"Catania","provincia":"CT"},{"cap":"95129","nome":"Catania","provincia":"CT"},
  {"cap":"95130","nome":"Catania","provincia":"CT"},{"cap":"95131","nome":"Catania","provincia":"CT"},
  {"cap":"96100","nome":"Siracusa","provincia":"SR"},{"cap":"91100","nome":"Trapani","provincia":"TP"},
  {"cap":"92100","nome":"Agrigento","provincia":"AG"},{"cap":"93100","nome":"Caltanissetta","provincia":"CL"},
  {"cap":"94100","nome":"Enna","provincia":"EN"},{"cap":"98100","nome":"Messina","provincia":"ME"},
  {"cap":"97100","nome":"Ragusa","provincia":"RG"},
  // TOSCANA
  {"cap":"50100","nome":"Firenze","provincia":"FI"},{"cap":"50121","nome":"Firenze","provincia":"FI"},
  {"cap":"50122","nome":"Firenze","provincia":"FI"},{"cap":"50123","nome":"Firenze","provincia":"FI"},
  {"cap":"50124","nome":"Firenze","provincia":"FI"},{"cap":"50125","nome":"Firenze","provincia":"FI"},
  {"cap":"50126","nome":"Firenze","provincia":"FI"},{"cap":"50127","nome":"Firenze","provincia":"FI"},
  {"cap":"50128","nome":"Firenze","provincia":"FI"},{"cap":"50129","nome":"Firenze","provincia":"FI"},
  {"cap":"50130","nome":"Firenze","provincia":"FI"},{"cap":"50131","nome":"Firenze","provincia":"FI"},
  {"cap":"50132","nome":"Firenze","provincia":"FI"},{"cap":"50133","nome":"Firenze","provincia":"FI"},
  {"cap":"50134","nome":"Firenze","provincia":"FI"},{"cap":"50135","nome":"Firenze","provincia":"FI"},
  {"cap":"50136","nome":"Firenze","provincia":"FI"},{"cap":"50137","nome":"Firenze","provincia":"FI"},
  {"cap":"50138","nome":"Firenze","provincia":"FI"},{"cap":"50139","nome":"Firenze","provincia":"FI"},
  {"cap":"50140","nome":"Firenze","provincia":"FI"},{"cap":"50141","nome":"Firenze","provincia":"FI"},
  {"cap":"50142","nome":"Firenze","provincia":"FI"},{"cap":"50143","nome":"Firenze","provincia":"FI"},
  {"cap":"50144","nome":"Firenze","provincia":"FI"},{"cap":"50145","nome":"Firenze","provincia":"FI"},
  {"cap":"50146","nome":"Firenze","provincia":"FI"},{"cap":"50147","nome":"Firenze","provincia":"FI"},
  {"cap":"50148","nome":"Firenze","provincia":"FI"},{"cap":"50149","nome":"Firenze","provincia":"FI"},
  {"cap":"59100","nome":"Prato","provincia":"PO"},{"cap":"52100","nome":"Arezzo","provincia":"AR"},
  {"cap":"55100","nome":"Lucca","provincia":"LU"},{"cap":"58100","nome":"Grosseto","provincia":"GR"},
  {"cap":"57100","nome":"Livorno","provincia":"LI"},{"cap":"54100","nome":"Massa","provincia":"MS"},
  {"cap":"56100","nome":"Pisa","provincia":"PI"},{"cap":"53100","nome":"Siena","provincia":"SI"},
  {"cap":"51100","nome":"Pistoia","provincia":"PT"},
  // TRENTINO ALTO ADIGE
  {"cap":"38100","nome":"Trento","provincia":"TN"},{"cap":"39100","nome":"Bolzano","provincia":"BZ"},
  // UMBRIA
  {"cap":"06100","nome":"Perugia","provincia":"PG"},{"cap":"05100","nome":"Terni","provincia":"TR"},
  // VALLE D'AOSTA
  {"cap":"11100","nome":"Aosta","provincia":"AO"},
  // VENETO
  {"cap":"30100","nome":"Venezia","provincia":"VE"},{"cap":"30121","nome":"Venezia","provincia":"VE"},
  {"cap":"30122","nome":"Venezia","provincia":"VE"},{"cap":"30123","nome":"Venezia","provincia":"VE"},
  {"cap":"30124","nome":"Venezia","provincia":"VE"},{"cap":"30125","nome":"Venezia","provincia":"VE"},
  {"cap":"30126","nome":"Venezia","provincia":"VE"},{"cap":"30127","nome":"Venezia","provincia":"VE"},
  {"cap":"30128","nome":"Venezia","provincia":"VE"},{"cap":"30129","nome":"Venezia","provincia":"VE"},
  {"cap":"30130","nome":"Venezia","provincia":"VE"},{"cap":"30131","nome":"Venezia","provincia":"VE"},
  {"cap":"30132","nome":"Venezia","provincia":"VE"},{"cap":"30133","nome":"Venezia","provincia":"VE"},
  {"cap":"30134","nome":"Venezia","provincia":"VE"},{"cap":"30135","nome":"Venezia","provincia":"VE"},
  {"cap":"30136","nome":"Venezia","provincia":"VE"},{"cap":"30137","nome":"Venezia","provincia":"VE"},
  {"cap":"30138","nome":"Venezia","provincia":"VE"},{"cap":"30139","nome":"Venezia","provincia":"VE"},
  {"cap":"30140","nome":"Venezia","provincia":"VE"},{"cap":"30141","nome":"Venezia","provincia":"VE"},
  {"cap":"30142","nome":"Venezia","provincia":"VE"},{"cap":"30143","nome":"Venezia","provincia":"VE"},
  {"cap":"30144","nome":"Venezia","provincia":"VE"},{"cap":"30145","nome":"Venezia","provincia":"VE"},
  {"cap":"30146","nome":"Venezia","provincia":"VE"},{"cap":"30147","nome":"Venezia","provincia":"VE"},
  {"cap":"30148","nome":"Venezia","provincia":"VE"},{"cap":"30149","nome":"Venezia","provincia":"VE"},
  {"cap":"30150","nome":"Venezia","provincia":"VE"},{"cap":"30151","nome":"Venezia","provincia":"VE"},
  {"cap":"30152","nome":"Venezia","provincia":"VE"},{"cap":"30153","nome":"Venezia","provincia":"VE"},
  {"cap":"30154","nome":"Venezia","provincia":"VE"},{"cap":"30155","nome":"Venezia","provincia":"VE"},
  {"cap":"30156","nome":"Venezia","provincia":"VE"},{"cap":"30157","nome":"Venezia","provincia":"VE"},
  {"cap":"30158","nome":"Venezia","provincia":"VE"},{"cap":"30159","nome":"Venezia","provincia":"VE"},
  {"cap":"30160","nome":"Venezia","provincia":"VE"},{"cap":"30161","nome":"Venezia","provincia":"VE"},
  {"cap":"30162","nome":"Venezia","provincia":"VE"},{"cap":"30163","nome":"Venezia","provincia":"VE"},
  {"cap":"30164","nome":"Venezia","provincia":"VE"},{"cap":"30165","nome":"Venezia","provincia":"VE"},
  {"cap":"30166","nome":"Venezia","provincia":"VE"},{"cap":"30167","nome":"Venezia","provincia":"VE"},
  {"cap":"30168","nome":"Venezia","provincia":"VE"},{"cap":"30169","nome":"Venezia","provincia":"VE"},
  {"cap":"30170","nome":"Venezia","provincia":"VE"},{"cap":"30171","nome":"Venezia","provincia":"VE"},
  {"cap":"30172","nome":"Venezia","provincia":"VE"},{"cap":"30173","nome":"Venezia","provincia":"VE"},
  {"cap":"30174","nome":"Venezia","provincia":"VE"},{"cap":"30175","nome":"Venezia","provincia":"VE"},
  {"cap":"35100","nome":"Padova","provincia":"PD"},{"cap":"36100","nome":"Vicenza","provincia":"VI"},
  {"cap":"37100","nome":"Verona","provincia":"VR"},{"cap":"31100","nome":"Treviso","provincia":"TV"},
  {"cap":"32100","nome":"Belluno","provincia":"BL"},{"cap":"45100","nome":"Rovigo","provincia":"RO"}
];

// Mappa province per ricerca per nome città
const PROVINCE_MAP = {};
COMUNI_DB.forEach(c => {
  const key = c.nome.toLowerCase();
  if (!PROVINCE_MAP[key]) PROVINCE_MAP[key] = c.provincia;
});

/**
 * Cerca comuni per CAP
 * @param {string} cap - CAP da cercare (5 cifre)
 * @returns {Array} - Lista comuni trovati [{nome, provincia}]
 */
export const cercaPerCAP = (cap) => {
  if (!cap || cap.length !== 5) return [];
  const risultati = COMUNI_DB.filter(c => c.cap === cap);
  // Rimuovi duplicati per nome
  const unici = [];
  const nomiVisti = new Set();
  risultati.forEach(r => {
    if (!nomiVisti.has(r.nome)) {
      nomiVisti.add(r.nome);
      unici.push({ nome: r.nome, provincia: r.provincia });
    }
  });
  return unici;
};

/**
 * Cerca provincia per nome città
 * @param {string} citta - Nome città
 * @returns {string} - Sigla provincia o stringa vuota
 */
export const cercaProvinciaPerCitta = (citta) => {
  if (!citta) return '';
  return PROVINCE_MAP[citta.toLowerCase()] || '';
};

export default COMUNI_DB;
