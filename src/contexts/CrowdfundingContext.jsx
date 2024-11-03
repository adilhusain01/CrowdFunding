import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../utils/contractHelpers';
import { set } from 'mongoose';

const CrowdfundingContext = createContext();

export const CrowdfundingProvider = ({ children }) => {
  const [contract, setContract] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProjectCreator, setIsProjectCreator] = useState(false);

  // Initialize contract
  const initializeContract = async (signer) => {
    try {
      const crowdfundingContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(crowdfundingContract);

      // Check roles
      const adminRole = await crowdfundingContract.DEFAULT_ADMIN_ROLE();
      const creatorRole = await crowdfundingContract.PROJECT_CREATOR_ROLE();
      const address = await signer.getAddress();

      const [isAdminRole, isCreatorRole] = await Promise.all([
        crowdfundingContract.hasRole(adminRole, address),
        crowdfundingContract.hasRole(creatorRole, address),
      ]);

      setIsAdmin(isAdminRole);
      setIsProjectCreator(isCreatorRole);
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize contract');
      console.error(err);
    }
  };

  // Create new project
  const createProject = async (
    title,
    description,
    goalAmount,
    durationInDays
  ) => {
    try {
      setLoading(true);
      const tx = await contract.createProject(
        title,
        description,
        ethers.utils.parseEther(goalAmount.toString()),
        durationInDays
      );
      await tx.wait();
      await loadProjects();
      setLoading(false);
    } catch (err) {
      setError('Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Contribute to project
  const contribute = async (projectId, amount) => {
    try {
      setLoading(true);
      const tx = await contract.contribute(projectId, {
        value: ethers.utils.parseEther(amount.toString()),
      });
      await tx.wait();
      await loadProjects();
      setLoading(false);
    } catch (err) {
      setError('Failed to contribute');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Submit expense
  const submitExpense = async (
    projectId,
    description,
    amount,
    category,
    proofUrl
  ) => {
    try {
      setLoading(true);
      const tx = await contract.submitExpense(
        projectId,
        description,
        ethers.utils.parseEther(amount.toString()),
        category,
        proofUrl
      );
      await tx.wait();
      setLoading(false);
    } catch (err) {
      setError('Failed to submit expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve expense
  const approveExpense = async (projectId, expenseIndex) => {
    try {
      setLoading(true);
      const tx = await contract.approveExpense(projectId, expenseIndex);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      setError('Failed to approve expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load projects
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectCount = await contract.projectCount();
      const projectsData = await Promise.all(
        Array(projectCount.toNumber())
          .fill()
          .map(async (_, index) => {
            const project = await contract.projects(index);
            const expenses = await contract.getProjectExpenses(index);
            const contributions = await contract.getProjectContributions(index);
            return {
              id: index,
              ...project,
              expenses,
              contributions,
            };
          })
      );
      setProjects(projectsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Claim refund
  const claimRefund = async (projectId) => {
    try {
      setLoading(true);
      const tx = await contract.claimRefund(projectId);
      await tx.wait();
      setLoading(false);
    } catch (err) {
      setError('Failed to claim refund');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const adminFunctions = {
    completeProject: async (projectId) => {
      const tx = await contract.completeProject(projectId);
      await tx.wait();
      await loadProjects();
    },
    cancelProject: async (projectId) => {
      const tx = await contract.cancelProject(projectId);
      await tx.wait();
      await loadProjects();
    },
    grantProjectCreatorRole: async (address) => {
      const tx = await contract.grantProjectCreatorRole(address);
      await tx.wait();
    },
    pause: async () => {
      const tx = await contract.pause();
      await tx.wait();
    },
    unpause: async () => {
      const tx = await contract.unpause();
      await tx.wait();
    },
  };

  return (
    <CrowdfundingContext.Provider
      value={{
        contract,
        projects,
        loading,
        error,
        isAdmin,
        isProjectCreator,
        initializeContract,
        createProject,
        contribute,
        submitExpense,
        approveExpense,
        claimRefund,
        adminFunctions,
        loadProjects,
      }}
    >
      {children}
    </CrowdfundingContext.Provider>
  );
};

export const useCrowdfunding = () => useContext(CrowdfundingContext);
