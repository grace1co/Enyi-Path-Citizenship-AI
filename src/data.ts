// Fallback study content for local testing.
import { Question, Flashcard } from "./types";

export const uscisQuestions: Question[] = [
  {
    id: 1,
    question: "What is one right or freedom from the First Amendment?",
    options: ["To bear arms", "Speech", "A speedy trial", "To vote"],
    correctAnswer: "B",
    explanation: "The First Amendment protects five freedoms: speech, religion, assembly, press, and the right to petition the government.",
    category: "Principles of American Democracy"
  },
  {
    id: 2,
    question: "What is an amendment?",
    options: [
      "A law passed by the Senate",
      "A decree by the Supreme Court",
      "A change (to the Constitution) or an addition (to the Constitution)",
      "A speech held by the President"
    ],
    correctAnswer: "C",
    explanation: "An amendment is a formal change or addition to the United States Constitution.",
    category: "Principles of American Democracy"
  },
  {
    id: 3,
    question: "What is the supreme law of the land?",
    options: ["The Declaration of Independence", "The Constitution", "The Articles of Confederation", "The Magna Carta"],
    correctAnswer: "B",
    explanation: "The Constitution is the supreme law of the land, meaning no federal state or local law can contradict its power or guidelines.",
    category: "Principles of American Democracy"
  },
  {
    id: 4,
    question: "What does the Constitution do?",
    options: [
      "Sets up the government and protects basic rights of Americans",
      "Appoints military commanders in times of crisis",
      "Drafts standard federal taxation rates",
      "Establishes a single religion for the country"
    ],
    correctAnswer: "A",
    explanation: "The Constitution sets up the three branches of governmental frameworks and guards the fundamental rights of all individuals residing in the United States.",
    category: "Principles of American Democracy"
  },
  {
    id: 5,
    question: "The idea of self-government is in the first three words of the Constitution. What are these words?",
    options: ["We the People", "Congress shall make", "Give me Liberty", "In God We"],
    correctAnswer: "A",
    explanation: "The famous words 'We the People' recognize the fundamental principle that the power of the U.S. government belongs directly to its citizens.",
    category: "Principles of American Democracy"
  },
  {
    id: 6,
    question: "How many amendments does the Constitution have?",
    options: ["10", "27", "50", "100"],
    correctAnswer: "B",
    explanation: "The Constitution has 27 amendments, the first 10 of which are famously called the Bill of Rights.",
    category: "Principles of American Democracy"
  },
  {
    id: 7,
    question: "What did the Declaration of Independence do?",
    options: ["Declared our independence from Great Britain", "Created the Supreme Court structure", "Ended slavery in the southern states", "Gave women the right to vote"],
    correctAnswer: "A",
    explanation: "Drafted by Thomas Jefferson in 1776, the Declaration announced the thirteen American colonies were free and independent from British rule.",
    category: "Principles of American Democracy"
  },
  {
    id: 8,
    question: "What are two rights in the Declaration of Independence?",
    options: [
      "Life and liberty",
      "Freedom of speech and select tax exemption",
      "The right to vote and bear arms",
      "Jury duty and free transit"
    ],
    correctAnswer: "A",
    explanation: "The Declaration of Independence names three inherent rights: life, liberty, and the pursuit of happiness.",
    category: "Principles of American Democracy"
  },
  {
    id: 9,
    question: "What is freedom of religion?",
    options: [
      "You can practice any religion, or not practice a religion",
      "You must attend a church of your choosing once a month",
      "No public institutions are allowed to mention faith",
      "The state decides the official church for all citizens"
    ],
    correctAnswer: "A",
    explanation: "Freedom of religion allows everyone to practice any faith they choose, or none at all.",
    category: "Principles of American Democracy"
  },
  {
    id: 10,
    question: "What is the economic system in the United States?",
    options: ["Socialist economy", "Communist economy", "Capitalist or market economy", "Feudal barter economy"],
    correctAnswer: "C",
    explanation: "The United States operates on a capitalist or free-market economic system based on supply and demand.",
    category: "Principles of American Democracy"
  },
  {
    id: 11,
    question: "What is the \"rule of law\"?",
    options: [
      "Judges hold total authority over all state legislations",
      "Everyone, including leaders, must follow the law",
      "Only non-citizens must obey established regulations",
      "The military forces enforce all standard rules"
    ],
    correctAnswer: "B",
    explanation: "The rule of law means that no one is above the law—citizens, leaders, and the government itself must obey it.",
    category: "Principles of American Democracy"
  },
  {
    id: 12,
    question: "Name one branch or part of the government.",
    options: ["The military forces", "The state police", "Congress", "The Federal Reserve"],
    correctAnswer: "C",
    explanation: "The government is divided into three parts: Congress (legislative), the President (executive), and the courts (judicial).",
    category: "System of Government"
  },
  {
    id: 13,
    question: "What stops one branch of government from becoming too powerful?",
    options: ["The federal military", "Checks and balances", "The state governors", "The national treasury"],
    correctAnswer: "B",
    explanation: "A system of checks and balances prevents any one branch of the federal government from gaining dominant power.",
    category: "System of Government"
  },
  {
    id: 14,
    question: "Who is in charge of the executive branch?",
    options: ["The Chief Justice", "The Speaker of the House", "The President", "The Secretary of State"],
    correctAnswer: "C",
    explanation: "The President of the United States is the head of the executive branch.",
    category: "System of Government"
  },
  {
    id: 15,
    question: "Who makes federal laws?",
    options: ["The Supreme Court", "The President", "Congress", "The federal departments"],
    correctAnswer: "C",
    explanation: "Federal laws are written, debated, and voted on by Congress.",
    category: "System of Government"
  },
  {
    id: 16,
    question: "What are the two parts of the U.S. Congress?",
    options: [
      "The Senate and House of Representatives",
      "The Supreme Court and Cabinet",
      "The Governors and Mayors",
      "The Democrats and Republicans"
    ],
    correctAnswer: "A",
    explanation: "Congress is a bicameral legislature consisting of the Senate and the House of Representatives.",
    category: "System of Government"
  },
  {
    id: 17,
    question: "How many U.S. Senators are there?",
    options: ["50", "100", "435", "538"],
    correctAnswer: "B",
    explanation: "There are 100 U.S. Senators, representing two from each of the 50 states.",
    category: "System of Government"
  },
  {
    id: 18,
    question: "We elect a U.S. Senator for how many years?",
    options: ["2", "4", "6", "8"],
    correctAnswer: "C",
    explanation: "U.S. Senators are elected for 6-year terms.",
    category: "System of Government"
  },
  {
    id: 19,
    question: "Who does a U.S. Senator represent?",
    options: [
      "Only the citizens who voted for them",
      "All people of the state",
      "The state governor and legislative assembly",
      "The federal executive offices"
    ],
    correctAnswer: "B",
    explanation: "A U.S. Senator represents all residents living within their state.",
    category: "System of Government"
  },
  {
    id: 20,
    question: "Why do some states have more Representatives than other states?",
    options: [
      "Because of the state's geographic size",
      "Because of the state's population",
      "Because of when they joined the Union",
      "Because they pay more federal taxes"
    ],
    correctAnswer: "B",
    explanation: "A state's representation in the House is based on its population; states with more people get more representatives.",
    category: "System of Government"
  },
  {
    id: 21,
    question: "We elect a U.S. Representative for how many years?",
    options: ["2", "4", "6", "8"],
    correctAnswer: "A",
    explanation: "U.S. Representatives are elected for 2-year terms.",
    category: "System of Government"
  },
  {
    id: 22,
    question: "The House of Representatives has how many voting members?",
    options: ["100", "270", "435", "538"],
    correctAnswer: "C",
    explanation: "The House of Representatives consists of 435 voting members, apportioned among the states.",
    category: "System of Government"
  },
  {
    id: 23,
    question: "We elect a President for how many years?",
    options: ["2", "4", "6", "8"],
    correctAnswer: "B",
    explanation: "The President of the United States serves a 4-year term.",
    category: "System of Government"
  },
  {
    id: 24,
    question: "In what month do we vote for President?",
    options: ["January", "March", "November", "December"],
    correctAnswer: "C",
    explanation: "Under federal law, presidential elections are held in November.",
    category: "System of Government"
  },
  {
    id: 25,
    question: "What is the name of the President of the United States now?",
    options: ["Barack Obama", "Joe Biden", "Donald Trump", "George W. Bush"],
    correctAnswer: "C",
    explanation: "Donald Trump is the President of the United States.",
    category: "System of Government",
    dynamic: true
  },
  {
    id: 26,
    question: "What is the name of the Vice President of the United States now?",
    options: ["Mike Pence", "JD Vance", "Nancy Pelosi", "Kamala Harris"],
    correctAnswer: "B",
    explanation: "JD Vance serves as the Vice President of the United States.",
    category: "System of Government",
    dynamic: true
  },
  {
    id: 27,
    question: "If the President can no longer serve, who becomes President?",
    options: ["The Chief Justice", "The Vice President", "The Speaker of the House", "The Secretary of State"],
    correctAnswer: "B",
    explanation: "The Vice President becomes President if the President dies, resigns, or is removed.",
    category: "System of Government"
  },
  {
    id: 28,
    question: "If both the President and the Vice President can no longer serve, who becomes President?",
    options: ["The Speaker of the House", "The Secretary of State", "The Secretary of Defense", "The President pro tempore of the Senate"],
    correctAnswer: "A",
    explanation: "Under the Presidential Succession Act, the Speaker of the House is second in line to succeed the President.",
    category: "System of Government"
  },
  {
    id: 29,
    question: "Who is the Commander in Chief of the military?",
    options: ["The Secretary of Defense", "The President", "The Chairman of the Joint Chiefs", "The General of the Army"],
    correctAnswer: "B",
    explanation: "The Constitution designates the President as the Commander in Chief of the Armed Forces.",
    category: "System of Government"
  },
  {
    id: 30,
    question: "Who signs bills to become laws?",
    options: ["The Speaker of the House", "The President", "The Vice President", "The Chief Justice"],
    correctAnswer: "B",
    explanation: "The President signs bills approved by both houses of Congress into law.",
    category: "System of Government"
  },
  {
    id: 31,
    question: "Who vetoes bills?",
    options: ["The President", "The House of Representatives", "The Senate", "The Supreme Court"],
    correctAnswer: "A",
    explanation: "The President has the power to veto legislative bills passed by Congress.",
    category: "System of Government"
  },
  {
    id: 32,
    question: "What does the President's Cabinet do?",
    options: ["Makes federal laws", "Advises the President", "Reviews Supreme Court rulings", "Manages state elections"],
    correctAnswer: "B",
    explanation: "The Cabinet consists of key advisors who help the President lead executive departments.",
    category: "System of Government"
  },
  {
    id: 33,
    question: "What are two Cabinet-level positions?",
    options: [
      "Secretary of State and Secretary of Labor",
      "Chief Justice and Speaker of the House",
      "Governor and Attorney General",
      "Senator and Representative"
    ],
    correctAnswer: "A",
    explanation: "Cabinet positions include the Secretary of State, Labor, Defense, Treasury, and others.",
    category: "System of Government"
  },
  {
    id: 34,
    question: "What does the judicial branch do?",
    options: [
      "Decides on tax rates",
      "Explains and reviews laws, and resolves disputes",
      "Signs international treaties",
      "Vetoes federal legislation"
    ],
    correctAnswer: "B",
    explanation: "The judicial branch interprets the law, applies it to individual cases, and decides if laws violate the Constitution.",
    category: "System of Government"
  },
  {
    id: 35,
    question: "What is the highest court in the United States?",
    options: ["The Federal District Court", "The U.S. Court of Appeals", "The Supreme Court", "The State Supreme Court"],
    correctAnswer: "C",
    explanation: "The Supreme Court is the highest court of authority in the United States.",
    category: "System of Government"
  },
  {
    id: 36,
    question: "How many justices are on the Supreme Court?",
    options: ["5", "7", "9", "12"],
    correctAnswer: "C",
    explanation: "There are currently 9 justices on the Supreme Court, consisting of one Chief Justice and eight Associate Justices.",
    category: "System of Government"
  },
  {
    id: 37,
    question: "Who is the Chief Justice of the United States now?",
    options: ["Clarence Thomas", "John Roberts", "Sonia Sotomayor", "Elena Kagan"],
    correctAnswer: "B",
    explanation: "John Roberts is the 17th Chief Justice of the United States.",
    category: "System of Government",
    dynamic: true
  },
  {
    id: 38,
    question: "Under our Constitution, some powers belong to the federal government. What is one power of the federal government?",
    options: ["To print money", "To give driver's licenses", "To provide schooling and education", "To approve zoning laws"],
    correctAnswer: "A",
    explanation: "The constitution gives the federal government the power to print money, declare war, create an army, and make treaties.",
    category: "System of Government"
  },
  {
    id: 39,
    question: "Under our Constitution, some powers belong to the states. What is one power of the states?",
    options: ["To print money", "To declare war", "To provide schooling and education", "To make treaties"],
    correctAnswer: "C",
    explanation: "Powers reserved for the states include providing education, providing safety (law enforcement/fire services), and issuing licenses.",
    category: "System of Government"
  },
  {
    id: 40,
    question: "What are the two major political parties in the United States?",
    options: ["Democratic and Republican", "Federalist and Whig", "Libertarian and Green", "Progressive and Conservative"],
    correctAnswer: "A",
    explanation: "The United States primarily operates under a two-party system with the Democratic and Republican parties.",
    category: "System of Government"
  },
  {
    id: 41,
    question: "What is the political party of the President now?",
    options: ["Democratic Party", "Republican Party", "Libertarian Party", "Independent"],
    correctAnswer: "B",
    explanation: "President Donald Trump belongs to the Republican Party.",
    category: "System of Government",
    dynamic: true
  },
  {
    id: 42,
    question: "What is the name of the Speaker of the House of Representatives now?",
    options: ["Nancy Pelosi", "Kevin McCarthy", "Mike Johnson", "Paul Ryan"],
    correctAnswer: "C",
    explanation: "Mike Johnson is the Speaker of the House of Representatives.",
    category: "System of Government",
    dynamic: true
  },
  {
    id: 43,
    question: "There are four amendments to the Constitution about who can vote. Describe one of them.",
    options: [
      "Only property owners can vote",
      "Citizens eighteen and older can vote",
      "You must pay a poll tax to vote",
      "Only men who are native-born can vote"
    ],
    correctAnswer: "B",
    explanation: "The 26th Amendment guarantees the right to vote for all citizens 18 years of age and older.",
    category: "System of Government"
  },
  {
    id: 44,
    question: "What is one responsibility that is only for United States citizens?",
    options: ["To pay income taxes", "To serve on a jury", "To obey speed limit laws", "To register property"],
    correctAnswer: "B",
    explanation: "Responsibilities exclusive to U.S. citizens include serving on a federal jury and voting in federal elections.",
    category: "Rights and Responsibilities"
  },
  {
    id: 45,
    question: "Name one right only for United States citizens.",
    options: ["Freedom of speech", "Freedom of religion", "Vote in a federal election", "Publish a newspaper"],
    correctAnswer: "C",
    explanation: "Citizen-only rights include voting in federal elections and running for federal office.",
    category: "Rights and Responsibilities"
  },
  {
    id: 46,
    question: "What are two rights of everyone living in the United States?",
    options: [
      "Freedom of speech and freedom of religion",
      "Right to vote in federal elections and hold federal office",
      "Free housing and free public transit",
      "Right to tax exemption and free college"
    ],
    correctAnswer: "A",
    explanation: "All individuals living in the United States have the right to freedom of expression, speech, assembly, and religion.",
    category: "Rights and Responsibilities"
  },
  {
    id: 47,
    question: "What do we show loyalty to when we say the Pledge of Allegiance?",
    options: ["The President", "The state of residency", "The United States and the flag", "The Congress"],
    correctAnswer: "C",
    explanation: "The Pledge of Allegiance is a commitment of loyalty to the flag and the United States.",
    category: "Rights and Responsibilities"
  },
  {
    id: 48,
    question: "What is one promise you make when you become a United States citizen?",
    options: [
      "To join the U.S. military",
      "To give up loyalty to other countries and defend the Constitution",
      "To never leave the country",
      "To join a political party"
    ],
    correctAnswer: "B",
    explanation: "New citizens pledge to give up allegiance to other nations, defend the Constitution, obey federal laws, and serve the U.S.",
    category: "Rights and Responsibilities"
  },
  {
    id: 49,
    question: "How old do citizens have to be to vote for President?",
    options: ["Seventeen", "Eighteen or older", "Twenty-one", "Twenty-five"],
    correctAnswer: "B",
    explanation: "The 26th Amendment lowered the voting age limit to 18 years.",
    category: "Rights and Responsibilities"
  },
  {
    id: 50,
    question: "What are two ways that Americans can participate in their democracy?",
    options: [
      "Vote and run for office",
      "Buy U.S. goods and pay taxes on time",
      "Obey speed limits and register an auto",
      "Travel and attend school"
    ],
    correctAnswer: "A",
    explanation: "Americans participate by voting, running for office, participating in campaigns, contacting representatives, and signing petitions.",
    category: "Rights and Responsibilities"
  },
  {
    id: 51,
    question: "When is the last day you can send in federal income tax forms?",
    options: ["January 1", "April 15", "July 4", "October 31"],
    correctAnswer: "B",
    explanation: "Income tax returns must be filed with the federal government on or before April 15 of each year.",
    category: "Rights and Responsibilities"
  },
  {
    id: 52,
    question: "When must all men register for the Selective Service?",
    options: ["At age 16", "Between eighteen and twenty-six", "At age twenty-one", "Only during times of war"],
    correctAnswer: "B",
    explanation: "The law requires all men of age 18 to 26 to register for the Selective Service system for national safety archives.",
    category: "Rights and Responsibilities"
  },
  {
    id: 53,
    question: "What did the Declaration of Independence do?",
    options: [
      "Announced our independence from Great Britain",
      "Formed the first standard federal tax plan",
      "Freed all slaves in North America",
      "Established the borders with Canada"
    ],
    correctAnswer: "A",
    explanation: "The Declaration announced that the American colonies were cutting ties with Great Britain in 1776.",
    category: "Principles of American Democracy"
  },
  {
    id: 54,
    question: "Who wrote the Declaration of Independence?",
    options: ["George Washington", "Benjamin Franklin", "Thomas Jefferson", "Alexander Hamilton"],
    correctAnswer: "C",
    explanation: "Thomas Jefferson was the principal drafter of the historic Declaration document.",
    category: "Principles of American Democracy"
  },
  {
    id: 55,
    question: "When was the Declaration of Independence adopted?",
    options: ["July 4, 1776", "September 17, 1787", "June 21, 1788", "November 11, 1918"],
    correctAnswer: "A",
    explanation: "The Continental Congress officially adopted the final text of the Declaration on July 4, 1776.",
    category: "Principles of American Democracy"
  },
  {
    id: 56,
    question: "There were 13 original states. Name three.",
    options: [
      "New York, New Jersey, and Pennsylvania",
      "Florida, Georgia, and Alabama",
      "Texas, California, and Oregon",
      "Ohio, Indiana, and Michigan"
    ],
    correctAnswer: "A",
    explanation: "The original 13 states include NH, MA, RI, CT, NY, NJ, PA, DE, MD, VA, NC, SC, and GA.",
    category: "Principles of American Democracy"
  },
  {
    id: 57,
    question: "What happened at the Constitutional Convention?",
    options: [
      "The Declaration of Independence was signed",
      "The Constitution was written",
      "George Washington was elected King",
      "The war with Great Britain was declared finished"
    ],
    correctAnswer: "B",
    explanation: "Federal delegates gathered in Philadelphia in 1787 to frame and draft the new Constitution of the United States.",
    category: "Principles of American Democracy"
  },
  {
    id: 58,
    question: "When was the Constitution written?",
    options: ["1776", "1787", "1803", "1865"],
    correctAnswer: "B",
    explanation: "The Constitution was finalized and signed by delegates on September 17, 1787.",
    category: "Principles of American Democracy"
  },
  {
    id: 59,
    question: "The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.",
    options: ["Thomas Jefferson", "Alexander Hamilton", "Benjamin Franklin", "George Washington"],
    correctAnswer: "B",
    explanation: "The papers were authored anonymously by Alexander Hamilton, James Madison, and John Jay under the name 'Publius'.",
    category: "Principles of American Democracy"
  },
  {
    id: 60,
    question: "What is one reason colonists came to America?",
    options: ["To escape high taxes in Spain", "Freedom", "To find spices", "To avoid military draft in France"],
    correctAnswer: "B",
    explanation: "Colonists sought political liberty, religious freedom, economic opportunity, and escape from European persecutions.",
    category: "Principles of American Democracy"
  },
  {
    id: 61,
    question: "Who lived in America before the Europeans arrived?",
    options: ["Vikings", "American Indians", "Africans", "East Asians"],
    correctAnswer: "B",
    explanation: "Native American Indian tribes and societies had populated the Americas thousands of years before European voyages.",
    category: "Principles of American Democracy"
  },
  {
    id: 62,
    question: "What group of people was taken to America and sold as slaves?",
    options: ["Africans", "English criminals", "Inca Indians", "Irish farmers"],
    correctAnswer: "A",
    explanation: "Captured Africans were transported via the transatlantic slave trade to compile slave labor in America.",
    category: "Principles of American Democracy"
  },
  {
    id: 63,
    question: "Why did the colonists fight the British?",
    options: [
      "Because of high taxes without representation",
      "Because the British military refused to protect them",
      "Because they wanted to colonize Canada",
      "Because they wanted a King of their own"
    ],
    correctAnswer: "A",
    explanation: "Colonists objected to taxation without representation, quartering of soldiers, and restriction of basic colonial self-governance.",
    category: "Principles of American Democracy"
  },
  {
    id: 64,
    question: "What is one thing Benjamin Franklin is famous for?",
    options: [
      "He was the first president",
      "He was a U.S. diplomat and writer of 'Poor Richard's Almanack'",
      "He invented the light bulb",
      "He explored Louisiana"
    ],
    correctAnswer: "B",
    explanation: "Franklin was a vital diplomat, senior constitutional representative, successful printer, and famous scientific inventor.",
    category: "Principles of American Democracy"
  },
  {
    id: 65,
    question: "Who is the \"Father of Our Country\"?",
    options: ["Thomas Jefferson", "Alexander Hamilton", "George Washington", "Abraham Lincoln"],
    correctAnswer: "C",
    explanation: "George Washington is called the Father of Our Country for his central military and executive roles in founding the nation.",
    category: "Principles of American Democracy"
  },
  {
    id: 66,
    question: "Who was the first President?",
    options: ["John Adams", "Thomas Jefferson", "George Washington", "James Madison"],
    correctAnswer: "C",
    explanation: "George Washington took the oath of office in 1789 to serve as the historic first President of the United States.",
    category: "Principles of American Democracy"
  },
  {
    id: 67,
    question: "What territory did the United States buy from France in 1803?",
    options: ["Alaska", "Texas", "The Louisiana Territory", "Florida"],
    correctAnswer: "C",
    explanation: "The Louisiana Purchase bought massive western lands from France, doubling the geographic size of the nation.",
    category: "American History"
  },
  {
    id: 68,
    question: "Name one war fought by the United States in the 1800s.",
    options: ["The Revolutionary War", "The Civil War", "World War I", "The Vietnam War"],
    correctAnswer: "B",
    explanation: "U.S. conflicts in the 1800s include the War of 1812, Mexican-American War, Civil War, and Spanish-American War.",
    category: "American History"
  },
  {
    id: 69,
    question: "Name the U.S. war between the North and the South.",
    options: ["The War of 1812", "The Civil War", "The Revolutionary War", "The French and Indian War"],
    correctAnswer: "B",
    explanation: "The Civil War was fought between northern Union states and southern seceding Confederate states (1861-1865).",
    category: "American History"
  },
  {
    id: 70,
    question: "Name one problem that led to the Civil War.",
    options: ["Taxation of tea", "Slavery", "Border disputes with Mexico", "Women's voting rights"],
    correctAnswer: "B",
    explanation: "Tensions over slavery, economic differences, and states' rights directly led to the outbreak of the Civil War.",
    category: "American History"
  },
  {
    id: 71,
    question: "Who was President during the Civil War?",
    options: ["George Washington", "Andrew Jackson", "Abraham Lincoln", "Ulysses S. Grant"],
    correctAnswer: "C",
    explanation: "Abraham Lincoln served as President throughout the Civil War, striving to preserve the Union.",
    category: "American History"
  },
  {
    id: 72,
    question: "What did the Emancipation Proclamation do?",
    options: [
      "Freed all citizens from taxes",
      "Freed the slaves in Confederate states",
      "Ended the War of 1812",
      "Gave women the right to vote"
    ],
    correctAnswer: "B",
    explanation: "Lincoln's proclamation decreed all enslaved individuals in rebellious southern territories as free.",
    category: "American History"
  },
  {
    id: 73,
    question: "What did Susan B. Anthony do?",
    options: ["Founded the Red Cross", "Fought for civil rights and women's rights", "Wrote the national anthem", "Was the first woman senator"],
    correctAnswer: "B",
    explanation: "Anthony was a landmark activist who dedicated her life to civil liberties and women's voting rights.",
    category: "American History"
  },
  {
    id: 74,
    question: "Name one war fought by the United States in the 1900s.",
    options: ["The War of 1812", "The Civil War", "World War I", "The Revolutionary War"],
    correctAnswer: "C",
    explanation: "U.S. military involvements in the 1900s include WWI, WWII, the Korean War, the Vietnam War, and the Gulf War.",
    category: "American History"
  },
  {
    id: 75,
    question: "Who was President during World War I?",
    options: ["Franklin D. Roosevelt", "Theodore Roosevelt", "Woodrow Wilson", "Herbert Hoover"],
    correctAnswer: "C",
    explanation: "Woodrow Wilson led the United States into WWI and proposed the League of Nations.",
    category: "American History"
  },
  {
    id: 76,
    question: "Who was President during the Great Depression and World War II?",
    options: ["Herbert Hoover", "Franklin D. Roosevelt", "Harry S. Truman", "Dwight D. Eisenhower"],
    correctAnswer: "B",
    explanation: "Franklin Roosevelt steered the nation through economic crisis and global war, serving four terms.",
    category: "American History"
  },
  {
    id: 77,
    question: "Who did the United States fight in World War II?",
    options: [
      "Russia, China, and Korea",
      "Germany, Italy, and Japan",
      "Great Britain, Spain, and France",
      "Austria, Turkey, and Hungary"
    ],
    correctAnswer: "B",
    explanation: "The U.S. fought the Axis powers, led by Nazi Germany, Fascist Italy, and Imperial Japan.",
    category: "American History"
  },
  {
    id: 78,
    question: "Before he was President, Eisenhower was a general. What war was he in?",
    options: ["The Civil War", "World War I", "World War II", "The Korean War"],
    correctAnswer: "C",
    explanation: "Dwight Eisenhower acted as the Supreme Commander of all allied forces in Europe during World War II.",
    category: "American History"
  },
  {
    id: 79,
    question: "During the Cold War, what was the main concern of the United States?",
    options: ["Capitalism", "Communism", "Climate Change", "Inflation"],
    correctAnswer: "B",
    explanation: "The containment and prevention of geopolitical Soviet Communism defined the Cold War conflicts.",
    category: "American History"
  },
  {
    id: 80,
    question: "What movement tried to end racial discrimination?",
    options: ["The Temperance movement", "The Civil Rights movement", "The Progressive movement", "The Suffrage movement"],
    correctAnswer: "B",
    explanation: "The civil rights movement targeted state segregation, voting barriers, and unequal racial discrimination.",
    category: "American History"
  },
  {
    id: 81,
    question: "What did Martin Luther King, Jr. do?",
    options: [
      "He was a U.S. Senator",
      "He fought for civil rights and worked for equality for all Americans",
      "He signed the Civil Rights Act into law",
      "He founded the NAACP"
    ],
    correctAnswer: "B",
    explanation: "King was an iconic civil rights advocate who campaigned non-violently to achieve constitutional equality.",
    category: "American History"
  },
  {
    id: 82,
    question: "What major event happened on September 11, 2001, in the United States?",
    options: [
      "An economic market crash",
      "Terrorists attacked the United States",
      "The end of the Cold War",
      "A major hurricane struck the Gulf Coast"
    ],
    correctAnswer: "B",
    explanation: "Islamic extremists hijacked flights to coordinate terrorist attacks on the World Trade Center towers and Pentagon.",
    category: "American History"
  },
  {
    id: 83,
    question: "Name one American Indian tribe in the United States.",
    options: ["Inca", "Aztec", "Cherokee", "Maori"],
    correctAnswer: "C",
    explanation: "Cherokee, Sioux, Navajo, Chippewa, Apache, Pueblo, and Iroquois are among major federally recognized tribes.",
    category: "American History"
  },
  {
    id: 84,
    question: "Name one of the two longest rivers in the United States.",
    options: ["Columbia River", "Mississippi River", "Colorado River", "Rio Grande"],
    correctAnswer: "B",
    explanation: "The Mississippi and Missouri rivers are the two longest rivers in the United States.",
    category: "Geography"
  },
  {
    id: 85,
    question: "What ocean is on the West Coast of the United States?",
    options: ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Arctic Ocean"],
    correctAnswer: "B",
    explanation: "The Pacific Ocean is on the West Coast of the United States.",
    category: "Geography"
  },
  {
    id: 86,
    question: "What ocean is on the East Coast of the United States?",
    options: ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Arctic Ocean"],
    correctAnswer: "A",
    explanation: "The Atlantic Ocean is on the East Coast of the United States.",
    category: "Geography"
  },
  {
    id: 87,
    question: "Name one U.S. territory.",
    options: ["The Bahamas", "Cuba", "Puerto Rico", "Jamaica"],
    correctAnswer: "C",
    explanation: "Puerto Rico, Guam, American Samoa, Northern Mariana Islands, and U.S. Virgin Islands are official territories.",
    category: "Geography"
  },
  {
    id: 88,
    question: "Name one state that borders Canada.",
    options: ["California", "Texas", "New York", "Florida"],
    correctAnswer: "C",
    explanation: "Thirteen U.S. states border Canada, which include Alaska, Washington, Michigan, New York, and Maine.",
    category: "Geography"
  },
  {
    id: 89,
    question: "Name one state that borders Mexico.",
    options: ["Florida", "Louisiana", "Texas", "Colorado"],
    correctAnswer: "C",
    explanation: "California, Arizona, New Mexico, and Texas share land borders with Mexico.",
    category: "Geography"
  },
  {
    id: 90,
    question: "What is the capital of the United States?",
    options: ["New York, NY", "Philadelphia, PA", "Washington, D.C.", "Boston, MA"],
    correctAnswer: "C",
    explanation: "The capital of the United States is Washington, D.C.",
    category: "Geography"
  },
  {
    id: 91,
    question: "Where is the Statue of Liberty?",
    options: ["San Francisco Bay", "Boston Harbor", "New York Harbor", "Washington, D.C."],
    correctAnswer: "C",
    explanation: "The monumental Statue of Liberty stands as a beacon of welcoming in New York Harbor.",
    category: "Geography"
  },
  {
    id: 92,
    question: "Why does the flag have 13 stripes?",
    options: [
      "For the 13 framers of the Constitution",
      "Because there were 13 original colonies",
      "For the 13 amendments in the Bill of Rights",
      "Because 13 is a lucky number"
    ],
    correctAnswer: "B",
    explanation: "The flag features 7 red and 6 white stripes to honor the original 13 American colonies.",
    category: "Symbols"
  },
  {
    id: 93,
    question: "Why does the flag have 50 stars?",
    options: [
      "For the 50 signers of the Constitution",
      "Because there is one star for each state",
      "For the 50 senators in the first Senate",
      "To represent 50 years of peace"
    ],
    correctAnswer: "B",
    explanation: "The fifty stars design represents each individual state in the modern Union.",
    category: "Symbols"
  },
  {
    id: 94,
    question: "What is the name of the national anthem?",
    options: ["God Bless America", "America the Beautiful", "The Star-Spangled Banner", "My Country, 'Tis of Thee"],
    correctAnswer: "C",
    explanation: "Our national anthem is 'The Star-Spangled Banner', composed by Francis Scott Key during the War of 1812.",
    category: "Symbols"
  },
  {
    id: 95,
    question: "When do we celebrate Independence Day?",
    options: ["January 1", "April 15", "July 4", "November 11"],
    correctAnswer: "C",
    explanation: "Americans commemorate the adopting of the Declaration of Independence on July 4.",
    category: "Holidays"
  },
  {
    id: 96,
    question: "Name two U.S. national holidays.",
    options: [
      "Thanksgiving and Christmas",
      "Halloween and Easter",
      "Mother's Day and Father's Day",
      "St. Patrick's Day and Earth Day"
    ],
    correctAnswer: "A",
    explanation: "U.S. federal national holidays include Memorial Day, Independence Day, Labor Day, Thanksgiving, and Christmas.",
    category: "Holidays"
  },
  {
    id: 97,
    question: "What do we call the first ten amendments to the Constitution?",
    options: ["The Bill of Rights", "The Articles of Confederation", "The Preamble", "The Declaration of Rights"],
    correctAnswer: "A",
    explanation: "The first ten amendments are known collectively as the Bill of Rights, outlining fundamental citizen protections.",
    category: "Principles of American Democracy"
  },
  {
    id: 98,
    question: "Who meets to make the nation's laws?",
    options: ["The Supreme Court Justices", "The President's Advisors", "Congress", "The State Legislatures"],
    correctAnswer: "C",
    explanation: "Congress is the legislative body of the federal government that writes, debates, and enacts national statutes.",
    category: "System of Government"
  },
  {
    id: 99,
    question: "What is the name of the President's official home?",
    options: ["The Capitol Building", "The Pentagon", "The White House", "Camp David"],
    correctAnswer: "C",
    explanation: "The official residence of the U.S. President is the White House, located at 1600 Pennsylvania Avenue in Washington, D.C.",
    category: "System of Government"
  },
  {
    id: 100,
    question: "Who is the Governor of your state now?",
    options: [
      "The representative from your home district",
      "An elected state senator",
      "The current Governor of your state",
      "The executive secretary of the state"
    ],
    correctAnswer: "C",
    explanation: "The Governor is the chief executive officer of their respective state government administration.",
    category: "System of Government",
    dynamic: true
  }
];

export const uscisFlashcards: Flashcard[] = [
  {
    id: 1,
    topic: "Supreme Law",
    question: "What is the supreme law of the land?",
    answer: "The Constitution",
    category: "Principles of American Democracy",
    isMastered: false
  },
  {
    id: 2,
    topic: "First Amendment",
    question: "What are the five rights protected by the First Amendment?",
    answer: "Speech, Religion, Assembly, Press, and Petitioning the government",
    category: "Rights and Responsibilities",
    isMastered: false
  },
  {
    id: 3,
    topic: "Branches of Government",
    question: "Name the three branches of the U.S. Government.",
    answer: "Legislative (Congress), Executive (President), and Judicial (Courts)",
    category: "System of Government",
    isMastered: false
  },
  {
    id: 4,
    topic: "Legislative Power",
    question: "Who makes federal laws?",
    answer: "Congress (Senate and House of Representatives)",
    category: "System of Government",
    isMastered: false
  },
  {
    id: 5,
    topic: "U.S. Senators",
    question: "How many U.S. Senators are there, and how long is their term?",
    answer: "There are 100 Senators (2 per state), elected for a 6-year term.",
    category: "System of Government",
    isMastered: false
  },
  {
    id: 6,
    topic: "House Term",
    question: "We elect a U.S. Representative for how many years?",
    answer: "2 years",
    category: "System of Government",
    isMastered: false
  },
  {
    id: 7,
    topic: "Supreme Court",
    question: "What is the highest court in the United States, and how many justices are on it?",
    answer: "The Supreme Court, which consists of 9 Supreme Court Justices.",
    category: "System of Government",
    isMastered: false
  },
  {
    id: 8,
    topic: "Cabinet Role",
    question: "What are two Cabinet-level positions?",
    answer: "Secretary of State, Secretary of the Treasury, Secretary of Defense, Attorney General, etc.",
    category: "System of Government",
    isMastered: false
  },
  {
    id: 9,
    topic: "Civil War Cause",
    question: "Name one problem that led to the Civil War.",
    answer: "Slavery, economic reasons/tariffs, or states' rights.",
    category: "American History",
    isMastered: false
  },
  {
    id: 10,
    topic: "Emancipation Proclamation",
    question: "What was the purpose of the Emancipation Proclamation?",
    answer: "It freed the slaves in the Confederate/southern states rebelling against the Union.",
    category: "American History",
    isMastered: false
  },
  {
    id: 11,
    topic: "Father of Our Country",
    question: "Who is the 'Father of Our Country'?",
    answer: "George Washington",
    category: "American History",
    isMastered: false
  },
  {
    id: 12,
    topic: "U.S. Territory",
    question: "Name one U.S. territory.",
    answer: "Puerto Rico, U.S. Virgin Islands, American Samoa, Northern Mariana Islands, Guam",
    category: "Geography",
    isMastered: false
  },
  {
    id: 13,
    topic: "National Anthem",
    question: "What is the name of the national anthem?",
    answer: "The Star-Spangled Banner",
    category: "Symbols & Holidays",
    isMastered: false
  },
  {
    id: 14,
    topic: "National Holidays",
    question: "Name three U.S. national holidays.",
    answer: "New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, Christmas",
    category: "Symbols & Holidays",
    isMastered: false
  }
];
