import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useCrowdfunding } from '../contexts/CrowdfundingContext';
import { Tab } from '@headlessui/react';
import { PlusCircle, AlertCircle, Check } from 'lucide-react';
import { ethers } from 'ethers';

const ExpenseCategories = {
  0: 'Development',
  1: 'Marketing',
  2: 'Operations',
  3: 'Infrastructure',
  4: 'Other',
};

const ProjectStatus = {
  0: 'Active',
  1: 'Completed',
  2: 'Cancelled',
};

export default function CrowdfundingApp() {
  const { signer, account } = useWallet();
  const {
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
  } = useCrowdfunding();

  const [createProjectForm, setCreateProjectForm] = useState({
    title: '',
    description: '',
    goalAmount: '',
    duration: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    projectId: '',
    description: '',
    amount: '',
    category: 0,
    proofUrl: '',
  });

  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [newCreatorAddress, setNewCreatorAddress] = useState('');

  useEffect(() => {
    if (signer) {
      initializeContract(signer);
      loadProjects();
    }
  }, [signer]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(
        createProjectForm.title,
        createProjectForm.description,
        createProjectForm.goalAmount,
        createProjectForm.duration
      );
      setCreateProjectForm({
        title: '',
        description: '',
        goalAmount: '',
        duration: '',
      });
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      await submitExpense(
        expenseForm.projectId,
        expenseForm.description,
        expenseForm.amount,
        expenseForm.category,
        expenseForm.proofUrl
      );
      setExpenseForm({
        projectId: '',
        description: '',
        amount: '',
        category: 0,
        proofUrl: '',
      });
    } catch (err) {
      console.error('Failed to submit expense:', err);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <Tab.Group>
        <Tab.List className='flex space-x-4 border-b mb-6'>
          <Tab
            className={({ selected }) =>
              `px-4 py-2 ${selected ? 'border-b-2 border-blue-500' : ''}`
            }
          >
            Projects
          </Tab>
          {isProjectCreator && (
            <Tab
              className={({ selected }) =>
                `px-4 py-2 ${selected ? 'border-b-2 border-blue-500' : ''}`
              }
            >
              Create Project
            </Tab>
          )}
          {isAdmin && (
            <Tab
              className={({ selected }) =>
                `px-4 py-2 ${selected ? 'border-b-2 border-blue-500' : ''}`
              }
            >
              Admin Panel
            </Tab>
          )}
        </Tab.List>

        <Tab.Panels>
          {/* Projects Panel */}
          <Tab.Panel>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {projects.map((project) => (
                <div key={project.id} className='border rounded-lg p-4 shadow'>
                  <h3 className='text-xl font-bold mb-2'>{project.title}</h3>
                  <p className='text-gray-600 mb-4'>{project.description}</p>
                  <div className='space-y-2'>
                    <p>Status: {ProjectStatus[project.status]}</p>
                    <p>
                      Goal: {ethers.utils.formatEther(project.goalAmount)} ETH
                    </p>
                    <p>
                      Current: {ethers.utils.formatEther(project.currentAmount)}
                      ETH
                    </p>
                    <div className='mt-4'>
                      {project.status === 0 && (
                        <div className='flex space-x-2'>
                          <input
                            type='number'
                            placeholder='Amount (ETH)'
                            className='border rounded px-2 py-1 w-32'
                            value={contributionAmount}
                            onChange={(e) =>
                              setContributionAmount(e.target.value)
                            }
                          />
                          <button
                            onClick={() =>
                              contribute(project.id, contributionAmount)
                            }
                            className='bg-blue-500 text-white px-4 py-1 rounded'
                          >
                            Contribute
                          </button>
                        </div>
                      )}
                      {project.status === 2 && (
                        <button
                          onClick={() => claimRefund(project.id)}
                          className='bg-red-500 text-white px-4 py-1 rounded'
                        >
                          Claim Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Tab.Panel>

          {/* Create Project Panel */}
          {isProjectCreator && (
            <Tab.Panel>
              <form
                onSubmit={handleCreateProject}
                className='max-w-lg space-y-4'
              >
                <div>
                  <label className='block mb-1'>Title</label>
                  <input
                    type='text'
                    className='w-full border rounded px-3 py-2'
                    value={createProjectForm.title}
                    onChange={(e) =>
                      setCreateProjectForm({
                        ...createProjectForm,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className='block mb-1'>Description</label>
                  <textarea
                    className='w-full border rounded px-3 py-2'
                    value={createProjectForm.description}
                    onChange={(e) =>
                      setCreateProjectForm({
                        ...createProjectForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className='block mb-1'>Goal Amount (ETH)</label>
                  <input
                    type='number'
                    className='w-full border rounded px-3 py-2'
                    value={createProjectForm.goalAmount}
                    onChange={(e) =>
                      setCreateProjectForm({
                        ...createProjectForm,
                        goalAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className='block mb-1'>Duration (days)</label>
                  <input
                    type='number'
                    className='w-full border rounded px-3 py-2'
                    value={createProjectForm.duration}
                    onChange={(e) =>
                      setCreateProjectForm({
                        ...createProjectForm,
                        duration: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  type='submit'
                  className='bg-blue-500 text-white px-4 py-2 rounded'
                >
                  Create Project
                </button>
              </form>
            </Tab.Panel>
          )}

          {isAdmin && (
            <Tab.Panel>
              <div className='space-y-6'>
                {/* Previous admin sections remain the same */}

                <div className='border rounded-lg p-4'>
                  <h3 className='text-lg font-bold mb-4'>Contract Controls</h3>
                  <div className='flex space-x-4'>
                    <button
                      onClick={adminFunctions.pause}
                      className='bg-yellow-500 text-white px-4 py-2 rounded'
                    >
                      Pause Contract
                    </button>
                    <button
                      onClick={adminFunctions.unpause}
                      className='bg-green-500 text-white px-4 py-2 rounded'
                    >
                      Unpause Contract
                    </button>
                  </div>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='text-lg font-bold mb-4'>
                    Grant Project Creator Role
                  </h3>
                  <div className='flex space-x-2'>
                    <input
                      type='text'
                      placeholder='Address'
                      className='flex-1 border rounded px-3 py-2'
                      onChange={(e) => setNewCreatorAddress(e.target.value)}
                      value={newCreatorAddress}
                    />
                    <button
                      onClick={() =>
                        adminFunctions.grantProjectCreatorRole(
                          newCreatorAddress
                        )
                      }
                      className='bg-blue-500 text-white px-4 py-2 rounded'
                    >
                      Grant Role
                    </button>
                  </div>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='text-lg font-bold mb-4'>Expense Management</h3>
                  {projects.map((project) => (
                    <div key={project.id} className='mb-6 border-b pb-4'>
                      <h4 className='font-bold text-lg mb-2'>
                        {project.title}
                      </h4>
                      {project.expenses?.length > 0 ? (
                        <div className='space-y-4'>
                          {project.expenses.map((expense, index) => (
                            <div
                              key={index}
                              className='border rounded p-3 bg-gray-50'
                            >
                              <div className='flex justify-between items-start'>
                                <div>
                                  <p className='font-medium'>
                                    {expense.description}
                                  </p>
                                  <p className='text-sm text-gray-600'>
                                    Amount: {expense.amount.toString()} ETH
                                  </p>
                                  <p className='text-sm text-gray-600'>
                                    Category:
                                    {ExpenseCategories[expense.category]}
                                  </p>
                                  <a
                                    href={expense.proofUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-blue-500 text-sm'
                                  >
                                    View Proof
                                  </a>
                                </div>
                                {!expense.approved && (
                                  <button
                                    onClick={() =>
                                      approveExpense(project.id, index)
                                    }
                                    className='bg-green-500 text-white px-3 py-1 rounded flex items-center'
                                  >
                                    <Check className='w-4 h-4 mr-1' />
                                    Approve
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-gray-500'>
                          No expenses submitted yet
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Tab.Panel>
          )}

          {/* Project Details Panel */}
          <Tab.Panel>
            {selectedProject && (
              <div className='space-y-6'>
                <div className='border rounded-lg p-6'>
                  <h2 className='text-2xl font-bold mb-4'>
                    {selectedProject.title}
                  </h2>
                  <div className='grid grid-cols-2 gap-4 mb-6'>
                    <div>
                      <h3 className='font-medium text-gray-600'>Status</h3>
                      <p className='text-lg'>
                        {ProjectStatus[selectedProject.status]}
                      </p>
                    </div>
                    <div>
                      <h3 className='font-medium text-gray-600'>Progress</h3>
                      <div className='w-full bg-gray-200 rounded-full h-2.5'>
                        <div
                          className='bg-blue-500 h-2.5 rounded-full'
                          style={{
                            width: `${
                              (selectedProject.currentAmount /
                                selectedProject.goalAmount) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className='text-sm mt-1'>
                        {selectedProject.currentAmount.toString()} /{' '}
                        {selectedProject.goalAmount.toString()} ETH
                      </p>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className='mt-8'>
                    <h3 className='text-xl font-bold mb-4'>Expenses</h3>
                    {selectedProject.expenses?.length > 0 ? (
                      <div className='space-y-4'>
                        {selectedProject.expenses.map((expense, index) => (
                          <div key={index} className='border rounded p-4'>
                            <div className='flex justify-between'>
                              <div>
                                <p className='font-medium'>
                                  {expense.description}
                                </p>
                                <p className='text-gray-600'>
                                  {expense.amount.toString()} ETH -{' '}
                                  {ExpenseCategories[expense.category]}
                                </p>
                              </div>
                              <div className='flex items-center'>
                                {expense.approved ? (
                                  <span className='text-green-500 flex items-center'>
                                    <Check className='w-4 h-4 mr-1' />
                                    Approved
                                  </span>
                                ) : (
                                  <span className='text-yellow-500 flex items-center'>
                                    <Clock className='w-4 h-4 mr-1' />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-gray-500'>No expenses recorded yet</p>
                    )}
                  </div>

                  {/* Submit Expense Form */}
                  {selectedProject.creator === account && (
                    <div className='mt-8'>
                      <h3 className='text-xl font-bold mb-4'>
                        Submit New Expense
                      </h3>
                      <form
                        onSubmit={handleSubmitExpense}
                        className='space-y-4'
                      >
                        <div>
                          <label className='block mb-1'>Description</label>
                          <input
                            type='text'
                            className='w-full border rounded px-3 py-2'
                            value={expenseForm.description}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                description: e.target.value,
                                projectId: selectedProject.id,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className='block mb-1'>Amount (ETH)</label>
                          <input
                            type='number'
                            step='0.001'
                            className='w-full border rounded px-3 py-2'
                            value={expenseForm.amount}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                amount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className='block mb-1'>Category</label>
                          <select
                            className='w-full border rounded px-3 py-2'
                            value={expenseForm.category}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                category: Number(e.target.value),
                              })
                            }
                          >
                            {Object.entries(ExpenseCategories).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <label className='block mb-1'>Proof URL</label>
                          <input
                            type='text'
                            className='w-full border rounded px-3 py-2'
                            value={expenseForm.proofUrl}
                            onChange={(e) =>
                              setExpenseForm({
                                ...expenseForm,
                                proofUrl: e.target.value,
                              })
                            }
                          />
                        </div>
                        <button
                          type='submit'
                          className='bg-blue-500 text-white px-4 py-2 rounded'
                        >
                          Submit Expense
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Loading and Error States */}
      {loading && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-4 rounded-lg'>
            <p className='text-lg'>Loading...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center'>
          <AlertCircle className='w-5 h-5 mr-2' />
          {error}
        </div>
      )}
    </div>
  );
}
