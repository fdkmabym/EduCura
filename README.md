# 📚 EduCura: Decentralized Content Curation Marketplace

Welcome to EduCura, a Web3 platform revolutionizing how educators create, share, and monetize lesson plans! Built on the Stacks blockchain with Clarity smart contracts, this marketplace allows educators to tokenize their lesson plans as NFTs, sell them with built-in royalty mechanisms, and enable community curation for quality assurance. No more centralized platforms taking huge cuts—empower creators with perpetual royalties and decentralized governance.

## ✨ Features

🎓 Tokenize lesson plans as unique NFTs  
💰 Sell and resell plans with automatic royalty payouts  
🗳️ Community curation and voting for featured content  
🔒 Immutable ownership and access licenses  
📈 Royalty smart contracts for secondary market earnings  
👥 User roles for educators, buyers, and curators  
🔍 Searchable marketplace with filters and reviews  
🚀 Low-cost, secure transactions on Stacks  

## 🛠 How It Works

EduCura uses 8 interconnected Clarity smart contracts to build a trustless marketplace for educational content. It addresses the real-world problem of undercompensated educators in centralized platforms by providing tokenized ownership, ongoing royalties, and community-driven curation, ensuring fair value distribution and high-quality resources.

### Key Components
- **UserRegistry.clar**: Manages user registration, profiles, and roles (educators, buyers, curators). Links STX addresses to identities.
- **LessonNFT.clar**: SIP-009 compliant NFT contract for minting tokenized lesson plans. Stores metadata like title, description, and content hash.
- **MarketplaceListing.clar**: Handles listing NFTs for sale, bidding, and direct purchases. Integrates with payment processing.
- **RoyaltyContract.clar**: Enforces royalty rules on every sale or resale, automatically distributing percentages to original creators.
- **CurationDAO.clar**: A governance contract for curators to vote on lesson plans, featuring top content and rewarding quality submissions.
- **PaymentToken.clar**: SIP-010 fungible token (CURA) for transactions, royalties, and curation rewards.
- **ReviewSystem.clar**: Allows buyers to leave verified reviews and ratings, tied to ownership for authenticity.
- **AccessLicense.clar**: Manages digital licenses for buyers, enabling secure access to lesson content post-purchase.

**For Educators**
- Register via UserRegistry and mint your lesson plan NFT with LessonNFT.
- List it on MarketplaceListing, setting price and royalty percentage (e.g., 10% on resales).
- Earn royalties automatically through RoyaltyContract on every secondary sale.

**For Buyers**
- Browse and search listings, purchase with CURA tokens.
- Gain access via AccessLicense; resell if desired, with royalties paid out.
- Leave reviews using ReviewSystem to help the community.

**For Curators**
- Join via UserRegistry and participate in CurationDAO votes.
- Earn CURA rewards for curating high-quality content.

**For Verifiers/Admins**
- Query contracts for transparency (e.g., get-royalty-history, verify-ownership).
- Governance proposals in CurationDAO for platform updates.

Deploy on Stacks testnet: Use Clarinet for development. Interact via STX wallets with functions like `mint-lesson`, `list-for-sale`, `vote-on-curation`, or `claim-royalty`. Empower education through blockchain—create, curate, and earn! 🚀