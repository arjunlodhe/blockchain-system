// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EduLedger {
    address public owner;
    
    // Admin management
    mapping(address => bool) public admins;
    
    // Track authorized universities separately
    mapping(address => bool) public authorizedUniversities;
    address[] public allUniversities;
    
    // Track authorized banks separately
    mapping(address => bool) public authorizedBanks;
    address[] public allBanks;

    struct StudentProfile {
        string name;
        uint256 dateOfBirth;
        string identificationNumber;
        string gender;
        string nationality;
        string contactEmail;
        string contactPhone;
        string permanentAddress;
        bool exists;
    }

    struct Credential {
        address issuer;
        string institutionName;
        string credentialType;
        uint256 startDate;
        uint256 endDate;
        string gradeOrPercentage;
        string ipfsHash;
        uint256 issuedAt;
    }

    struct AdmissionRequest {
        string universityName;
        string courseName;
        string admissionId;
        string ipfsHash;
        bool isVerified;
        bool exists;
    }

    struct LoanRequest {
        uint256 loanAmount;
        string loanPurpose;
        uint256 repaymentPeriod;
        bool isApproved;
        bool exists;
        uint256 requestedAt;
    }

    struct LoanEligibility {
        bool isEligible;
        uint256 creditScore;
        uint256 maxLoanAmount;
        uint256 interestRate;
        uint256 lastUpdated;
    }

    // Constants
    uint256 private constant CREDENTIAL_WEIGHT = 30;
    uint256 private constant ADMISSION_WEIGHT = 25;
    uint256 private constant ACADEMIC_WEIGHT = 20;
    uint256 private constant PROFILE_WEIGHT = 15;
    uint256 private constant MIN_CREDIT_SCORE = 600;
    uint256 private constant MAX_CREDIT_SCORE = 850;

    // Mappings
    mapping(address => StudentProfile) public studentProfiles;
    mapping(address => Credential[]) public studentCredentials;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => AdmissionRequest) public admissionRequests;
    mapping(address => LoanRequest) public loanRequests;
    mapping(address => LoanEligibility) public loanEligibility;
    mapping(address => uint256) public creditScores;
    mapping(string => bool) public usedAdmissionIds;

    // Events
    event StudentProfileCreated(address indexed studentAddress, string name);
    event CredentialIssued(address indexed student, address indexed issuer, string credentialType);
    event AdmissionRequestCreated(address indexed studentAddress, string universityName, string courseName, string admissionId);
    event AdmissionRequestVerified(address indexed studentAddress, address indexed verifiedBy, string admissionId);
    event LoanRequestCreated(address indexed studentAddress, uint256 loanAmount, string loanPurpose);
    event LoanRequestApproved(address indexed studentAddress, address indexed approvedBy, uint256 loanAmount);
    event CreditScoreUpdated(address indexed student, uint256 score);
    event UniversityAdded(address indexed universityAddress);
    event UniversityRemoved(address indexed universityAddress);
    event BankAdded(address indexed bankAddress);
    event BankRemoved(address indexed bankAddress);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Only issuer");
        _;
    }

    modifier onlyBank() {
        require(authorizedBanks[msg.sender], "Only bank");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // Admin management functions
    function addAdmin(address _adminAddress) external onlyOwner {
        require(_adminAddress != address(0), "Invalid address");
        require(!admins[_adminAddress], "Already admin");
        
        admins[_adminAddress] = true;
    }

    function removeAdmin(address _adminAddress) external onlyOwner {
        require(_adminAddress != address(0), "Invalid address");
        require(admins[_adminAddress], "Not admin");
        require(_adminAddress != owner, "Cannot remove owner");
        
        admins[_adminAddress] = false;
    }

    // University management functions
    function addUniversity(address _universityAddress) external onlyAdmin {
        require(_universityAddress != address(0), "Invalid address");
        require(!authorizedUniversities[_universityAddress], "Already authorized");
        
        authorizedUniversities[_universityAddress] = true;
        authorizedIssuers[_universityAddress] = true;
        allUniversities.push(_universityAddress);
        emit UniversityAdded(_universityAddress);
    }

    function removeUniversity(address _universityAddress) external onlyAdmin {
        require(_universityAddress != address(0), "Invalid address");
        require(authorizedUniversities[_universityAddress], "Not authorized");
        
        authorizedUniversities[_universityAddress] = false;
        authorizedIssuers[_universityAddress] = false;
        
        for (uint i = 0; i < allUniversities.length; i++) {
            if (allUniversities[i] == _universityAddress) {
                allUniversities[i] = allUniversities[allUniversities.length - 1];
                allUniversities.pop();
                break;
            }
        }
        
        emit UniversityRemoved(_universityAddress);
    }

    // Bank management functions
    function addBank(address _bankAddress) external onlyAdmin {
        require(_bankAddress != address(0), "Invalid address");
        require(!authorizedBanks[_bankAddress], "Already authorized");
        
        authorizedBanks[_bankAddress] = true;
        authorizedIssuers[_bankAddress] = true;
        allBanks.push(_bankAddress);
        emit BankAdded(_bankAddress);
    }

    function removeBank(address _bankAddress) external onlyAdmin {
        require(_bankAddress != address(0), "Invalid address");
        require(authorizedBanks[_bankAddress], "Not authorized");
        
        authorizedBanks[_bankAddress] = false;
        authorizedIssuers[_bankAddress] = false;
        
        for (uint i = 0; i < allBanks.length; i++) {
            if (allBanks[i] == _bankAddress) {
                allBanks[i] = allBanks[allBanks.length - 1];
                allBanks.pop();
                break;
            }
        }
        
        emit BankRemoved(_bankAddress);
    }

    // View functions for admin management
    function isAdmin(address _address) external view returns (bool) {
        return admins[_address] || _address == owner;
    }

    function getAllUniversities() external view returns (address[] memory) {
        return allUniversities;
    }

    function getAllBanks() external view returns (address[] memory) {
        return allBanks;
    }

    // Student profile management
    function createStudentProfile(
        address _studentAddress,
        string memory _name,
        uint256 _dateOfBirth,
        string memory _identificationNumber,
        string memory _gender,
        string memory _nationality,
        string memory _contactEmail,
        string memory _contactPhone,
        string memory _permanentAddress
    ) external onlyIssuer {
        require(!studentProfiles[_studentAddress].exists, "Profile exists");
        
        studentProfiles[_studentAddress] = StudentProfile({
            name: _name,
            dateOfBirth: _dateOfBirth,
            identificationNumber: _identificationNumber,
            gender: _gender,
            nationality: _nationality,
            contactEmail: _contactEmail,
            contactPhone: _contactPhone,
            permanentAddress: _permanentAddress,
            exists: true
        });

        emit StudentProfileCreated(_studentAddress, _name);
    }

    function issueCredential(
        address _studentAddress,
        string memory _institutionName,
        string memory _credentialType,
        uint256 _startDate,
        uint256 _endDate,
        string memory _gradeOrPercentage,
        string memory _ipfsHash
    ) external onlyIssuer {
        require(studentProfiles[_studentAddress].exists, "No profile");
        
        studentCredentials[_studentAddress].push(Credential({
            issuer: msg.sender,
            institutionName: _institutionName,
            credentialType: _credentialType,
            startDate: _startDate,
            endDate: _endDate,
            gradeOrPercentage: _gradeOrPercentage,
            ipfsHash: _ipfsHash,
            issuedAt: block.timestamp
        }));

        _updateCreditScore(_studentAddress);
        emit CredentialIssued(_studentAddress, msg.sender, _credentialType);
    }

    // Student view functions
    function getMyProfile() external view returns (
        string memory,
        uint256,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory
    ) {
        require(studentProfiles[msg.sender].exists, "No profile");
        StudentProfile memory profile = studentProfiles[msg.sender];
        return (
            profile.name,
            profile.dateOfBirth,
            profile.identificationNumber,
            profile.gender,
            profile.nationality,
            profile.contactEmail,
            profile.contactPhone,
            profile.permanentAddress
        );
    }

    function getMyCredentialCount() external view returns (uint) {
        return studentCredentials[msg.sender].length;
    }

    function getMyCredential(uint _index) external view returns (
        address,
        string memory,
        string memory,
        uint256,
        uint256,
        string memory,
        string memory,
        uint256
    ) {
        require(_index < studentCredentials[msg.sender].length, "Invalid index");
        Credential storage cred = studentCredentials[msg.sender][_index];
        return (
            cred.issuer,
            cred.institutionName,
            cred.credentialType,
            cred.startDate,
            cred.endDate,
            cred.gradeOrPercentage,
            cred.ipfsHash,
            cred.issuedAt
        );
    }

    // Admission requests
    function createAdmissionRequest(
        string memory _universityName,
        string memory _courseName,
        string memory _admissionId,
        string memory _ipfsHash
    ) external {
        require(!admissionRequests[msg.sender].exists, "Request exists");
        require(!usedAdmissionIds[_admissionId], "Admission ID used");
        
        admissionRequests[msg.sender] = AdmissionRequest({
            universityName: _universityName,
            courseName: _courseName,
            admissionId: _admissionId,
            ipfsHash: _ipfsHash,
            isVerified: false,
            exists: true
        });
        
        usedAdmissionIds[_admissionId] = true;
        emit AdmissionRequestCreated(msg.sender, _universityName, _courseName, _admissionId);
    }

    function verifyAdmissionRequest(address _studentAddress) external onlyIssuer {
        require(admissionRequests[_studentAddress].exists, "No request");
        require(!admissionRequests[_studentAddress].isVerified, "Already verified");
        
        admissionRequests[_studentAddress].isVerified = true;
        _updateCreditScore(_studentAddress);
        emit AdmissionRequestVerified(_studentAddress, msg.sender, admissionRequests[_studentAddress].admissionId);
    }

    // Loan requests
    function createLoanRequest(
        uint256 _loanAmount,
        string memory _loanPurpose,
        uint256 _repaymentPeriod
    ) external {
        require(!loanRequests[msg.sender].exists, "Request exists");
        require(_loanAmount > 0, "Invalid amount");
        require(_repaymentPeriod > 0, "Invalid period");
        
        loanRequests[msg.sender] = LoanRequest({
            loanAmount: _loanAmount,
            loanPurpose: _loanPurpose,
            repaymentPeriod: _repaymentPeriod,
            isApproved: false,
            exists: true,
            requestedAt: block.timestamp
        });
        
        emit LoanRequestCreated(msg.sender, _loanAmount, _loanPurpose);
    }

    function approveLoanRequest(address _studentAddress) external onlyBank {
        require(loanRequests[_studentAddress].exists, "No request");
        require(!loanRequests[_studentAddress].isApproved, "Already approved");
        
        loanRequests[_studentAddress].isApproved = true;
        emit LoanRequestApproved(_studentAddress, msg.sender, loanRequests[_studentAddress].loanAmount);
    }

    // Credit Scoring System
    function calculateCreditScore(address _studentAddress) public view returns (uint256) {
        require(studentProfiles[_studentAddress].exists, "No profile");
        
        uint256 score = 0;
        uint256 credentialCount = studentCredentials[_studentAddress].length;
        
        // Credentials Score (30%)
        if (credentialCount >= 3) score += 300;
        else if (credentialCount == 2) score += 200;
        else if (credentialCount == 1) score += 100;
        
        // Admission Status Score (25%)
        if (admissionRequests[_studentAddress].exists) {
            if (admissionRequests[_studentAddress].isVerified) score += 250;
            else score += 50;
        }
        
        // Academic Performance Score (20%)
        if (credentialCount > 0) score += 200;
        
        // Profile Completeness Score (15%)
        StudentProfile memory profile = studentProfiles[_studentAddress];
        if (bytes(profile.contactEmail).length > 0 && bytes(profile.identificationNumber).length > 0) {
            score += 150;
        }
        
        return score > MAX_CREDIT_SCORE ? MAX_CREDIT_SCORE : score;
    }

    function _updateCreditScore(address _studentAddress) internal {
        uint256 score = calculateCreditScore(_studentAddress);
        creditScores[_studentAddress] = score;
        emit CreditScoreUpdated(_studentAddress, score);
    }

    function checkLoanEligibility(address _studentAddress) public returns (LoanEligibility memory) {
        require(authorizedIssuers[msg.sender], "Not authorized");
        require(studentProfiles[_studentAddress].exists, "No profile");
        
        uint256 score = calculateCreditScore(_studentAddress);
        creditScores[_studentAddress] = score;
        
        LoanEligibility memory eligibility;
        eligibility.creditScore = score;
        eligibility.lastUpdated = block.timestamp;
        
        if (score < MIN_CREDIT_SCORE) {
            eligibility.isEligible = false;
        } else {
            eligibility.isEligible = true;
            uint256 baseAmount = (score * 1 ether) / 100;
            
            if (score >= 800) {
                eligibility.interestRate = 500;
                eligibility.maxLoanAmount = baseAmount * 2;
            } else if (score >= 700) {
                eligibility.interestRate = 700;
                eligibility.maxLoanAmount = baseAmount * 3 / 2;
            } else if (score >= 650) {
                eligibility.interestRate = 900;
                eligibility.maxLoanAmount = baseAmount;
            } else {
                eligibility.interestRate = 1200;
                eligibility.maxLoanAmount = baseAmount / 2;
            }
        }
        
        loanEligibility[_studentAddress] = eligibility;
        emit CreditScoreUpdated(_studentAddress, score);
        
        return eligibility;
    }

    function getLoanEligibility(address _studentAddress) public view returns (LoanEligibility memory) {
        return loanEligibility[_studentAddress];
    }

    function getCreditScore(address _studentAddress) public view returns (uint256) {
        return creditScores[_studentAddress];
    }

    // Utility function
    function addIssuer(address _issuerAddress) external onlyAdmin {
        require(_issuerAddress != address(0), "Invalid address");
        require(!authorizedIssuers[_issuerAddress], "Already authorized");
        
        authorizedIssuers[_issuerAddress] = true;
    }
}