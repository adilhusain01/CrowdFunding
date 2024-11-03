import { useWallet } from '../contexts/WalletContext';

const Navbar = () => {
  const { account, connectWallet } = useWallet();

  return (
    <nav className='bg-white shadow-lg'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center'>
            <h1 className='text-xl font-bold text-gray-800'>
              Transparent Crowdfunding
            </h1>
          </div>
          <button
            onClick={connectWallet}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            {account
              ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
              : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
