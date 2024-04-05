// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


// import "hardhat/console.sol";

contract YupBaseContentRewards is Initializable, PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {

    using BytesLib for bytes;
    using Address for address;
 

    address erc20TokenAddres;
    uint maxValidity;

    event ClaimExecuted(string claimString, address userAddress, uint256 amount, uint validityTs, bytes signature, address signer);

    mapping (address => uint) public lastClaimTs;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _initialOwner, address _initToken, uint _maxValidity) initializer public {
        
        erc20TokenAddres = _initToken;
        maxValidity = _maxValidity;
        
        __Pausable_init();
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
 

    function getDelimiterCountAndPos (bytes memory textBytes) private pure returns (uint, uint[] memory) {
        uint substringCount = 0;
        uint[] memory delmPos = new uint[](4);
        bytes memory delimiterBytes = bytes("|");

        for (uint i = 0; i < textBytes.length; i++) {
            if (textBytes[i] == delimiterBytes[0]) {
                substringCount++;
                delmPos[substringCount] = i;
            }
        }

        return (substringCount, delmPos);
    }
 
    function strToUint(string memory _str) private pure returns(uint256 res, bool err) {
    
        for (uint256 i = 0; i < bytes(_str).length; i++) {
            if ((uint8(bytes(_str)[i]) - 48) < 0 || (uint8(bytes(_str)[i]) - 48) > 9) {
                return (0, false);
            }
            res += (uint8(bytes(_str)[i]) - 48) * 10**(bytes(_str).length - i - 1);
        }
        
        return (res, true);
    }

    function toAddress(string memory s) private pure returns (address) {
        bytes memory _bytes = hexStringToBytes(s);
        require(_bytes.length >= 1 + 20, "error converting Address out Of Bounds");
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), 1)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

     function hexStringToBytes(string memory s) public pure returns (bytes memory) {
        bytes memory ss = bytes(s);
        require(ss.length%2 == 0);
        bytes memory r = new bytes(ss.length/2);
        for (uint i=0; i<ss.length/2; ++i) {
            r[i] = bytes1(fromHexChar(uint8(ss[2*i])) * 16 +
                        fromHexChar(uint8(ss[2*i+1])));
        }

        return r;

    }

     function fromHexChar(uint8 c) private pure returns (uint8) {
        if (bytes1(c) >= bytes1('0') && bytes1(c) <= bytes1('9')) {
            return c - uint8(bytes1('0'));
        }
        if (bytes1(c) >= bytes1('a') && bytes1(c) <= bytes1('f')) {
            return 10 + c - uint8(bytes1('a'));
        }
        if (bytes1(c) >= bytes1('A') && bytes1(c) <= bytes1('F')) {
            return 10 + c - uint8(bytes1('A'));
        }
        return 0;
    }

    function claimTokens (string memory claimString) public {
        require(!paused(), "Contract is paused");

        bytes memory textBytes = bytes(claimString);

        require(textBytes.length > 0, "Claim string cannot be empty");

        (uint substringCount, uint[] memory delmPos) = getDelimiterCountAndPos(textBytes);
        
        require(substringCount == 3, "Invalid claim string, must have 3 delimiters");

        bytes memory amountStr = textBytes.slice(0, delmPos[1]);
        bytes memory addressStr = textBytes.slice(delmPos[1] + 1, delmPos[2] - delmPos[1] - 1);
        bytes memory validityTsStr = textBytes.slice(delmPos[2] + 1, delmPos[3] - delmPos[2] - 1);
        bytes memory signatureStr = textBytes.slice(delmPos[3] + 1, textBytes.length - delmPos[3] - 1);

        require(amountStr.length > 0, "Amount string cannot be empty");
        require(addressStr.length > 0, "Address string cannot be empty");
        require(validityTsStr.length > 0, "Timestamp string cannot be empty");
        require(signatureStr.length > 0, "Signature string cannot be empty");
        require(addressStr.length == 42, "Invalid string address length");

        (uint amount, bool err) = strToUint(string(amountStr));

        require(err, "Invalid amount string");
        require(amount > 0, "Amount must be greater than 0");

        address userAddress = toAddress(string(addressStr));

       (uint validityTs, bool errTs) = strToUint(string(validityTsStr));
       
        require(errTs, "Invalid timestamp string");
 
        uint curentTime = block.timestamp;

        if( curentTime > validityTs + maxValidity) {
            revert("Claim expired");
        }

        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(textBytes.slice(0, delmPos[3]));

        bytes memory sig = hexStringToBytes(string(signatureStr));

        address signer = ECDSA.recover(messageHash,sig);

        require(signer == owner(), "Invalid signature");

        uint lastClaim = lastClaimTs[userAddress];

        if ( lastClaim > 0 &&  curentTime < lastClaim + (maxValidity * 2)) {
            string memory maxValidityS = Strings.toString(curentTime - lastClaim + (maxValidity * 2 ));
            revert(string(abi.encodePacked("Claim executed to recently, wait ", maxValidityS, " seconds to try another claim")));
        }

        if( ERC20(erc20TokenAddres).balanceOf(address(this)) < amount) {
            revert("Insufficient balance in contract");
        }

        ERC20(erc20TokenAddres).transfer(userAddress, amount);

        lastClaimTs[userAddress] = curentTime;
 
        emit ClaimExecuted(claimString, userAddress, amount, validityTs, signatureStr, userAddress);       
    }

    function setContractToken(address newTokenAddress) public onlyOwner {
        erc20TokenAddres = newTokenAddress;
    }

    function getContractToken() public view returns (address) {
        return erc20TokenAddres;
    }

    function setOwner(address newOwner) public onlyOwner {
        transferOwnership(newOwner);
    }

    function setIntialState(address _initialOwner, address _initToken) public onlyOwner {
        transferOwnership(_initialOwner);
        erc20TokenAddres = _initToken;
    }

    function setMaxValidity(uint _maxValidity) public onlyOwner {
        maxValidity = _maxValidity;
    }

    function getMaxValidity() public view returns (uint) {
        return maxValidity;
    }

    function transferTokens(address tokenAddress, address to, uint256 amount) public onlyOwner {
        ERC20(tokenAddress).transfer(to, amount);
    }

    function withdrawTokens(address tokenAddress, uint256 amount) public onlyOwner {
        ERC20(tokenAddress).transfer(msg.sender, amount);
    }

    function withdrawNative(uint256 amount) public onlyOwner {
        payable(msg.sender).transfer(amount);
    }

    function getBalance(address tokenAddress) public view returns (uint256) {
        return ERC20(tokenAddress).balanceOf(address(this));
    }

    function getOwner() public view returns (address) {
        return owner();
    }

    function getTsOfLastClaim(address userAddress) public view returns (uint) {
        return lastClaimTs[userAddress];
    }
}