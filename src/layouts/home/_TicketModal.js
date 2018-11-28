import React from 'react';
import Modal from 'react-modal';

import './_TicketModal.sass';

class TicketModal extends React.Component {
    constructor(props) {
        super(props);
        this.fileReader = null;
    }

    componentWillMount() {
        Modal.setAppElement('main');
    }

    handleFileChosen(file) {
        this.fileReader = new FileReader();
        this.fileReader.onload = function() {
            let arr = new Uint8Array(this.result);
            // TODO: Read the data and parse into JSON
        }
        this.fileReader.readAsArrayBuffer(file);
    }

    render() {
        return (
            <Modal
                isOpen={this.props.show}
                contentLabel={'TicketModal'}
                className='modal'
                overlayClassName='modal-overlay'
                onRequestClose={this.props.handleClose}
                shouldFocusAfterRender={false}
                shouldReturnFocusAfterClose={false}
            >
                <div className='modal-content'>
                    <div className='modal-header'>
                        <h2>Upload ticket PDF(s)</h2>
                    </div>
                    <div className='modal-body'>
                        <div className='upload-box'>upload</div>
                        <div className='upload-box'>test</div>
                    </div>
                    <div className='modal-footer'>
                        <input
                            type='file'
                            onChange={ e => this.handleFileChosen(e.target.files[0]) }
                        />
                    </div>
                </div>
            </Modal>
        )
    }
}

export default TicketModal